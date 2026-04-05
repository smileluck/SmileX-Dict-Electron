import logging
import traceback

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
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


def _is_chinese(text: str) -> bool:
    return any("\u4e00" <= c <= "\u9fff" for c in text)


def _request_ctx(request: Request) -> str:
    parts = [f"method={request.method}", f"path={request.url.path}"]
    if request.query_params:
        parts.append(f"query={request.query_params}")
    return ", ".join(parts)


def register_exception_handlers(app):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error.get("loc", []))
            if field:
                errors.append(f"{field}: {error.get('msg', '验证错误')}")
            else:
                errors.append(error.get("msg", "验证错误"))

        logger.warning(f"请求参数验证失败: {_request_ctx(request)}, errors={errors}")

        return JSONResponse(
            status_code=422,
            content={"detail": errors[0] if errors else "请求参数验证失败"},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, str):
            if not _is_chinese(detail):
                detail = ERROR_TRANSLATIONS.get(
                    detail, STATUS_MESSAGES.get(exc.status_code, detail)
                )

        if exc.status_code >= 500:
            logger.error(
                f"HTTP异常: {_request_ctx(request)}, "
                f"status_code={exc.status_code}, detail={detail}"
            )
        elif exc.status_code >= 400:
            logger.warning(
                f"HTTP异常: {_request_ctx(request)}, "
                f"status_code={exc.status_code}, detail={detail}"
            )

        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(
            f"未捕获的异常: {_request_ctx(request)}, "
            f"exception_type={type(exc).__name__}, message={str(exc)}\n"
            f"{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "服务器错误，请稍后重试"},
        )
