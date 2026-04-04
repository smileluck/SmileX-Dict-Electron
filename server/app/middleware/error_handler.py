import logging
import traceback

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("app.error")

ERROR_TRANSLATIONS = {
    "Username already registered": "用户名已被注册",
    "Incorrect username or password": "用户名或密码错误",
    "Could not validate credentials": "认证失败，请重新登录",
}

STATUS_MESSAGES = {
    400: "请求参数错误",
    401: "用户名或密码错误",
    403: "没有访问权限",
    404: "资源不存在",
    422: "数据格式错误",
    500: "服务器内部错误",
}


def register_exception_handlers(app):
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, str):
            detail = ERROR_TRANSLATIONS.get(
                detail, STATUS_MESSAGES.get(exc.status_code, detail)
            )

        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": "服务器错误，请稍后重试"},
        )
