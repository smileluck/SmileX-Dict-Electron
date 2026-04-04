import time
import logging
import threading
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

MAX_RETRIES = 3
RETRY_DELAY = 1.0
REQUEST_TIMEOUT = 10
RATE_LIMIT_DELAY = 0.3

_last_request_time = 0.0
_rate_limit_lock = threading.Lock()


def _rate_limit():
    global _last_request_time
    with _rate_limit_lock:
        now = time.time()
        elapsed = now - _last_request_time
        if elapsed < RATE_LIMIT_DELAY:
            time.sleep(RATE_LIMIT_DELAY - elapsed)
        _last_request_time = time.time()


def _skip_whitespace_siblings(element):
    sibling = element.next_sibling
    while sibling and sibling.name is None and str(sibling).strip() == "":
        sibling = sibling.next_sibling
    return sibling


def _safe_get(func, default=""):
    try:
        result = func()
        return result if result else default
    except (AttributeError, IndexError, TypeError, ValueError):
        return default


def lookup_word(word: str) -> Optional[dict]:
    if not word or not word.strip():
        return None

    word = word.strip()
    url = f"https://dict.youdao.com/w/{word}/#keyfrom=dict2.top"

    for attempt in range(MAX_RETRIES):
        try:
            _rate_limit()
            response = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)

            if response.status_code == 404:
                logger.info(f"Word not found: {word}")
                return None

            if response.status_code != 200:
                logger.warning(
                    f"HTTP {response.status_code} for '{word}' (attempt {attempt + 1})"
                )
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                return None

            return _parse_youdao_html(response.text, word)

        except requests.RequestException as e:
            logger.warning(f"Request error for '{word}': {e} (attempt {attempt + 1})")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                logger.error(f"Failed to lookup '{word}' after {MAX_RETRIES} attempts")
                return None

    return None


def _parse_youdao_html(html_content: str, word: str) -> Optional[dict]:
    soup = BeautifulSoup(html_content, "html.parser")
    phrs_list_tab = soup.find(id="phrsListTab")
    if phrs_list_tab is None:
        logger.info(f"No phrsListTab for '{word}' — word may not exist")
        return None

    result = {
        "term": word,
        "ipa": "",
        "phonetic_uk": "",
        "phonetic_us": "",
        "meaning": "",
        "en_meaning": "",
        "examples": [],
        "phrases": [],
        "synonyms": [],
        "grammar": [],
    }

    _extract_phonetics(phrs_list_tab, result)
    _extract_desc(phrs_list_tab, result)
    _extract_grammar(phrs_list_tab, result)
    _extract_paraphrase(soup, result)
    _extract_phrases(soup, result)
    _extract_examples(soup, result)

    if not result["meaning"] and result.get("_web_meaning"):
        result["meaning"] = result.pop("_web_meaning")
    elif result.get("_web_meaning"):
        del result["_web_meaning"]

    if not result["meaning"]:
        logger.info(f"No meaning found for '{word}'")
        return None

    return result


def _extract_phonetics(phrs_list_tab, result: dict):
    baav = phrs_list_tab.find("div", class_="baav")
    if baav is None:
        return
    for item in baav.children:
        if item.name != "span":
            continue
        phonetic_span = item.find("span", class_="phonetic")
        if phonetic_span is not None:
            phonetic_text = phonetic_span.text.strip().strip("/[]")
            is_uk = "英" in item.text
            if is_uk:
                result["phonetic_uk"] = phonetic_text
            else:
                result["phonetic_us"] = phonetic_text
    result["ipa"] = result["phonetic_uk"] or result["phonetic_us"]


def _extract_desc(phrs_list_tab, result: dict):
    trans_container = phrs_list_tab.find("div", class_="trans-container")
    if trans_container is None:
        return
    trans_list = trans_container.find_all("li")
    meaning_parts = []
    for li in trans_list:
        text = li.text.strip()
        if not text:
            continue
        try:
            idx = text.index(".") + 1
            pos = text[:idx].strip()
            trans = text[idx:].strip()
            meaning_parts.append(f"{pos} {trans}")
        except ValueError:
            meaning_parts.append(text)
    result["meaning"] = "\n".join(meaning_parts)


def _extract_grammar(phrs_list_tab, result: dict):
    addition = phrs_list_tab.find("p", class_="additional")
    if addition is None:
        return
    text = addition.text.strip()
    if text.startswith("[") and text.endswith("]"):
        text = text[1:-1]
    elif text.startswith("(") and text.endswith(")"):
        text = text[1:-1]
    parts = [w for w in text.split() if w]
    for i in range(0, len(parts) - 1, 2):
        label = parts[i].rstrip(":")
        form = parts[i + 1] if i + 1 < len(parts) else ""
        result["grammar"].append(f"{label}: {form}")


def _extract_paraphrase(soup, result: dict):
    en_meaning_parts = []

    t_web_trans = soup.find(id="tWebTrans")
    if t_web_trans is not None:
        wt_containers = t_web_trans.find_all("div", class_="wt-container")
        web_parts = []
        for item in wt_containers:
            content = _safe_get(
                lambda: item.find("p", class_="collapse-content").get_text().strip()
            )
            if content:
                web_parts.append(content)
        if web_parts:
            result["_web_meaning"] = "；".join(web_parts[:3])

    t_pe_trans = soup.find(id="tPETrans")
    if t_pe_trans is not None:
        wt_containers = _safe_get(
            lambda: t_pe_trans.find(id="tPETrans-all-trans").find_all(
                "li", class_="types"
            )
        )
        if wt_containers:
            for item in wt_containers:
                mean = _safe_get(lambda: item.find("span", class_="title").text.strip())
                source = item.find("p", class_="source")
                desc_en = _safe_get(lambda: source.text.strip()) if source else ""
                if desc_en:
                    en_meaning_parts.append(f"{mean} {desc_en}")

    t_ee_trans = soup.find(id="tEETrans")
    if t_ee_trans is not None:
        ul = t_ee_trans.find("ul")
        if ul:
            for item in ul.children:
                if item.name != "li":
                    continue
                sub_items = item.find_all("li")
                if not sub_items:
                    sub_items = [item]
                pos = _safe_get(lambda: item.find("span", class_="pos").text.strip())
                for sub in sub_items:
                    def_text = _safe_get(
                        lambda: sub.find("span", class_="def").text.strip()
                    )
                    if def_text:
                        en_meaning_parts.append(f"{pos} {def_text}")
                    synonym_links = sub.find_all("a", class_="search-js")
                    for link in synonym_links:
                        syn_text = link.text.strip()
                        if syn_text and syn_text not in result["synonyms"]:
                            result["synonyms"].append(syn_text)

    if en_meaning_parts:
        result["en_meaning"] = "\n".join(en_meaning_parts[:5])


def _extract_phrases(soup, result: dict):
    word_group = soup.find(id="wordGroup")
    if word_group is None:
        return
    groups = word_group.find_all("p", class_="wordGroup")
    for group in groups:
        content_title = group.find("span", class_="contentTitle")
        if content_title is None:
            continue
        phrase_text = _safe_get(lambda: content_title.find("a").text.strip())
        description = _safe_get(
            lambda: _skip_whitespace_siblings(content_title).text.strip()
        )
        if phrase_text:
            phrase_entry = phrase_text
            if description:
                phrase_entry += f" {description}"
            result["phrases"].append(phrase_entry)


def _extract_examples(soup, result: dict):
    example_parts = []

    bilingual = soup.find(id="bilingual")
    if bilingual is not None:
        examples = bilingual.find_all("li")
        for example in examples:
            example_ps = example.find_all("p")
            if len(example_ps) >= 2:
                sentence = example_ps[0].text.strip()
                translation = example_ps[1].text.strip()
                if sentence:
                    entry = sentence
                    if translation:
                        entry += f"\n{translation}"
                    example_parts.append(entry)

    authority = soup.find(id="authority")
    if authority is not None:
        examples = authority.find_all("li")
        for example in examples:
            example_ps = example.find_all("p")
            if len(example_ps) >= 1:
                sentence = example_ps[0].text.strip()
                if sentence:
                    example_parts.append(sentence)

    result["examples"] = example_parts[:8]


def batch_lookup_words(words: list[str], on_progress=None) -> list[dict]:
    results = []
    total = len(words)
    for i, word in enumerate(words):
        word = word.strip()
        if not word:
            continue
        data = lookup_word(word)
        if data:
            results.append(data)
        if on_progress:
            on_progress(i + 1, total, word, data)
    return results
