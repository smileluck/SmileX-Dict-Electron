import logging
from peewee import *

# 配置 logging 模块
# logger = logging.getLogger('peewee')
# logger.setLevel(logging.DEBUG)
# logger.addHandler(logging.StreamHandler())

from config import DB_CONFIG

database = MySQLDatabase(
    DB_CONFIG["db"],
    **{
        "charset": DB_CONFIG["charset"],
        # "sql_mode": "PIPES_AS_CONCAT",
        "use_unicode": True,
        "host": DB_CONFIG["host"],
        "port": DB_CONFIG["port"],
        "user": DB_CONFIG["user"],
        "password": DB_CONFIG["password"],
    }
)


class UnknownField(object):
    def __init__(self, *_, **__):
        pass


class BaseModel(Model):
    class Meta:
        database = database


class DtDict(BaseModel):
    create_time = DateTimeField(null=True)
    id = BigAutoField()
    level = IntegerField(null=True)
    type = CharField(null=True)
    phonetic_uk = CharField(null=True)
    phonetic_uk_url = CharField(null=True)
    phonetic_us = CharField(null=True)
    phonetic_us_url = CharField(null=True)
    tags = CharField(null=True)
    update_time = DateTimeField(null=True)
    word_text = CharField(null=True)

    class Meta:
        table_name = "dt_dict"


class DtDictDesc(BaseModel):
    create_time = DateTimeField(null=True)
    desc = CharField(null=True)
    id = BigAutoField()
    properties = CharField(null=True)
    update_time = DateTimeField(null=True)
    word_id = BigIntegerField(null=True)

    class Meta:
        table_name = "dt_dict_desc"


class DtDictExample(BaseModel):
    audio_url = CharField(null=True)
    create_time = DateTimeField(null=True)
    from_type = CharField(null=True)
    id = BigAutoField()
    mean = CharField(null=True)
    ref = CharField(null=True)
    sentence = CharField(null=True)
    update_time = DateTimeField(null=True)
    word_id = BigIntegerField(null=True)

    class Meta:
        table_name = "dt_dict_example"


class DtDictGrammer(BaseModel):
    create_time = DateTimeField(null=True)
    grammer_label = CharField(null=True)
    id = BigAutoField()
    to_word_id = BigIntegerField(null=True)
    update_time = DateTimeField(null=True)
    word_id = BigIntegerField(null=True)
    word_text = CharField(null=True)

    class Meta:
        table_name = "dt_dict_grammer"


class DtDictParaphrase(BaseModel):
    create_time = DateTimeField(null=True)
    description = CharField(null=True)
    description_en = CharField(null=True)
    from_type = CharField(null=True)
    id = BigAutoField()
    mean = CharField(null=True)
    scene = CharField(null=True)
    synonym_ids = CharField(null=True)
    synonym_word_text = CharField(null=True)
    update_time = DateTimeField(null=True)
    word_id = BigIntegerField(null=True)

    class Meta:
        table_name = "dt_dict_paraphrase"


class DtDictPhrase(BaseModel):
    create_time = DateTimeField(null=True)
    id = BigAutoField()
    to_word_id = BigIntegerField(null=True)
    update_time = DateTimeField(null=True)
    word_desc = CharField(null=True)
    word_id = BigIntegerField(null=True)
    word_text = CharField(null=True)

    class Meta:
        table_name = "dt_dict_phrase"
