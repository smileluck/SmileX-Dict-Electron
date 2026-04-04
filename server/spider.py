"""
有道词典爬取模块 — 从有道词典网页版抓取单词释义。

功能：
- 查询单词获取音标、词性释义、网络释义、英英释义、短语、例句、近义词
- 带重试机制和请求延迟
- 返回结构化字典，可直接映射到 WordItemModel

数据来源：dict.youdao.com
"""

import time
import logging
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# 请求头
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

# 重试配置
MAX_RETRIES = 3
RETRY_DELAY = 1.0  # 秒
REQUEST_TIMEOUT = 10  # 秒
RATE_LIMIT_DELAY = 0.3  # 每次请求间隔（秒）

# 上次请求时间（用于限速）
_last_request_time = 0.0


def _rate_limit():
    """请求间隔控制，避免过于频繁。"""
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < RATE_LIMIT_DELAY:
        time.sleep(RATE_LIMIT_DELAY - elapsed)
    _last_request_time = time.time()


def _skip_whitespace_siblings(element):
    """跳过空白文本节点，返回下一个有效兄弟元素。"""
    sibling = element.next_sibling
    while sibling and sibling.name is None and str(sibling).strip() == "":
        sibling = sibling.next_sibling
    return sibling


def _safe_get(func, default=""):
    """安全调用，异常时返回默认值。"""
    try:
        result = func()
        return result if result else default
    except (AttributeError, IndexError, TypeError, ValueError):
        return default


def lookup_word(word: str) -> Optional[dict]:
    """
    查询有道词典，返回结构化单词数据。

    Args:
        word: 要查询的英文单词或短语

    Returns:
        结构化字典，包含以下字段：
        - term: 单词文本
        - ipa: 音标（优先英式）
        - phonetic_uk: 英式音标
        - phonetic_us: 美式音标
        - meaning: 中文释义（词性+翻译，多行拼接）
        - en_meaning: 英英释义
        - examples: 例句列表
        - phrases: 短语列表
        - synonyms: 近义词列表
        - grammar: 词形变化

        如果单词不存在或查询失败，返回 None
    """
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
    """
    解析有道词典HTML页面，提取单词信息。

    将有道6表结构映射为扁平化字典：
    - dt_dict → term, phonetic_uk, phonetic_us
    - dt_dict_desc → meaning (拼接词性+翻译)
    - dt_dict_paraphrase (from_type=3) → en_meaning
    - dt_dict_paraphrase (synonym_word_text) → synonyms
    - dt_dict_phrase → phrases
    - dt_dict_example → examples
    - dt_dict_grammer → grammar
    """
    soup = BeautifulSoup(html_content, "html.parser")

    # 检查是否存在有效释义
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

    # ── 1. 音标 ──
    _extract_phonetics(phrs_list_tab, result)

    # ── 2. 简明释义（词性 + 翻译）→ meaning ──
    _extract_desc(phrs_list_tab, result)

    # ── 3. 词形变化 → grammar ──
    _extract_grammar(phrs_list_tab, result)

    # ── 4. 网络释义 + 专业释义 + 英英释义 ──
    _extract_paraphrase(soup, result)

    # ── 5. 短语/词组 → phrases ──
    _extract_phrases(soup, result)

    # ── 6. 例句 → examples ──
    _extract_examples(soup, result)

    # 如果 meaning 为空，说明可能是短语或特殊词，尝试用网络释义补充
    if not result["meaning"] and result.get("_web_meaning"):
        result["meaning"] = result.pop("_web_meaning")
    elif result.get("_web_meaning"):
        del result["_web_meaning"]

    # 如果 meaning 仍然为空，视为查词失败
    if not result["meaning"]:
        logger.info(f"No meaning found for '{word}'")
        return None

    return result


def _extract_phonetics(phrs_list_tab, result: dict):
    """提取英式/美式音标。"""
    baav = phrs_list_tab.find("div", class_="baav")
    if baav is None:
        return

    for item in baav.children:
        if item.name != "span":
            continue
        phonetic_span = item.find("span", class_="phonetic")
        if phonetic_span is not None:
            # 去除音标两端的斜杠/方括号
            phonetic_text = phonetic_span.text.strip().strip("/[]")
            phonetic_audio = _skip_whitespace_siblings(phonetic_span)
            is_uk = "英" in item.text
            if is_uk:
                result["phonetic_uk"] = phonetic_text
            else:
                result["phonetic_us"] = phonetic_text
        else:
            # 某些页面可能只有音频链接没有音标文本
            phonetic_audio = item.find("a", class_="dictvoice")

    # 优先使用英式音标作为主音标
    result["ipa"] = result["phonetic_uk"] or result["phonetic_us"]


def _extract_desc(phrs_list_tab, result: dict):
    """提取简明释义（词性 + 翻译），拼接为多行字符串。"""
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
            # 没有词性标注，直接作为翻译
            meaning_parts.append(text)

    result["meaning"] = "\n".join(meaning_parts)


def _extract_grammar(phrs_list_tab, result: dict):
    """提取词形变化（过去式、复数等）。"""
    addition = phrs_list_tab.find("p", class_="additional")
    if addition is None:
        return

    text = addition.text.strip()
    # 去除两端可能的括号
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
    """提取网络释义、专业释义、英英释义。"""
    en_meaning_parts = []

    # ── 网络释义 ──
    t_web_trans = soup.find(id="tWebTrans")
    if t_web_trans is not None:
        wt_containers = t_web_trans.find_all("div", class_="wt-container")
        web_parts = []
        for item in wt_containers:
            mean = _safe_get(
                lambda: item.find("div", class_="title").find("span").text.strip()
            )
            content = _safe_get(
                lambda: item.find("p", class_="collapse-content").get_text().strip()
            )
            if content:
                web_parts.append(content)
        if web_parts:
            result["_web_meaning"] = "；".join(web_parts[:3])

    # ── 专业释义 ──
    t_pe_trans = soup.find(id="tPETrans")
    if t_pe_trans is not None:
        scenes = _safe_get(
            lambda: t_pe_trans.find(id="tPETrans-type-list").find_all(
                "a", class_="p-type"
            )
        )
        wt_containers = _safe_get(
            lambda: t_pe_trans.find(id="tPETrans-all-trans").find_all(
                "li", class_="types"
            )
        )
        if scenes and wt_containers:
            for i, item in enumerate(wt_containers):
                mean = _safe_get(lambda: item.find("span", class_="title").text.strip())
                source = item.find("p", class_="source")
                desc_en = _safe_get(lambda: source.text.strip()) if source else ""
                desc = _safe_get(lambda: item.find("p", class_="trans").text.strip())
                if desc_en:
                    en_meaning_parts.append(f"{mean} {desc_en}")

    # ── 英英释义 + 近义词 ──
    t_ee_trans = soup.find(id="tEETrans")
    if t_ee_trans is not None:
        ul = t_ee_trans.find("ul")
        if ul:
            for item in ul.children:
                if item.name != "li":
                    continue
                # 处理嵌套 li
                sub_items = item.find_all("li")
                if not sub_items:
                    sub_items = [item]

                pos = _safe_get(lambda: item.find("span", class_="pos").text.strip())
                for sub in sub_items:
                    def_text = _safe_get(
                        lambda: sub.find("span", class_="def").text.strip()
                    )
                    em_text = _safe_get(
                        lambda: sub.find("em").text.strip() if sub.find("em") else ""
                    )
                    if def_text:
                        en_meaning_parts.append(f"{pos} {def_text}")

                    # 提取近义词
                    synonym_links = sub.find_all("a", class_="search-js")
                    for link in synonym_links:
                        syn_text = link.text.strip()
                        if syn_text and syn_text not in result["synonyms"]:
                            result["synonyms"].append(syn_text)

    if en_meaning_parts:
        result["en_meaning"] = "\n".join(en_meaning_parts[:5])


def _extract_phrases(soup, result: dict):
    """提取短语/词组。"""
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
    """提取双语例句和权威例句。"""
    example_parts = []

    # ── 双语例句 ──
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

    # ── 权威例句 ──
    authority = soup.find(id="authority")
    if authority is not None:
        examples = authority.find_all("li")
        for example in examples:
            example_ps = example.find_all("p")
            if len(example_ps) >= 1:
                sentence = example_ps[0].text.strip()
                if sentence:
                    example_parts.append(sentence)

    result["examples"] = example_parts[:8]  # 最多保留8个例句


def batch_lookup_words(words: list[str], on_progress=None) -> list[dict]:
    """
    批量查询单词。

    Args:
        words: 单词列表
        on_progress: 进度回调函数 callback(current, total, word, result)

    Returns:
        成功查询到的单词数据列表
    """
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
