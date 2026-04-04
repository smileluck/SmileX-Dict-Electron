from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.config import settings as app_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserModel
from app.schemas.common import ExportData
from app.services import import_service
from app.services.dict_service import get_dict_or_404

router = APIRouter()


@router.get("/export", response_model=ExportData)
def export_data(
    current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)
):
    return import_service.export_all_data(db, current_user.id)


@router.post("/import")
def import_data(
    payload: ExportData,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import_service.import_all_data(db, current_user.id, payload)
    return {"detail": "导入成功"}


@router.post("/import/txt")
def import_txt(
    file: UploadFile = File(...),
    dictId: str = Form(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_dict_or_404(db, dictId, current_user.id)

    if not file.filename or not file.filename.endswith(".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="仅支持 .txt 文件"
        )

    max_size = app_settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    raw = file.file.read()
    if len(raw) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过 {app_settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            content = raw.decode("gbk")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件编码不支持，请使用 UTF-8 编码",
            )

    words = [line.strip() for line in content.splitlines() if line.strip()]
    if not words:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="文件为空或未包含有效单词"
        )

    return import_service.start_txt_import(db, words, dictId, current_user.id)


@router.get("/import/status")
def get_import_status(
    taskId: str = Query(...), current_user: UserModel = Depends(get_current_user)
):
    return import_service.get_import_status(taskId)


@router.post("/import/quick-txt")
def quick_import_txt(
    file: UploadFile = File(...),
    dictId: str = Form(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_dict_or_404(db, dictId, current_user.id)

    if not file.filename or not file.filename.endswith(".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="仅支持 .txt 文件"
        )

    max_size = app_settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    raw = file.file.read()
    if len(raw) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小不能超过 {app_settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            content = raw.decode("gbk")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="文件编码不支持，请使用 UTF-8 编码",
            )

    words = [line.strip() for line in content.splitlines() if line.strip()]
    if not words:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="文件为空或未包含有效单词"
        )

    return import_service.quick_import_txt(db, words, dictId, current_user.id)
