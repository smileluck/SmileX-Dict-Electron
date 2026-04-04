from fastapi import status
from httpx import AsyncClient
from app.schemas.auth import AuthResponse
from app.services.auth_service import login_user,from app.models.user import UserModel
from app.config import settings as app_settings
import app.models  # noqa: F401 - needed for all models
from app.schemas.auth import AuthResponse
from app.services.auth_service import login_user
from app.models.user import UserModel
from app.config import settings as app_settings
import app.models  # noqa: F401 - needed for all models"
SQLALCHEMY_DATABASE_URL = "sqlite:///file::memory:?cache=shared:test.db"
TestEngine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False},
    poolclass=StaticPool(TestEngine, pool_with=TestEngine),
)
TestingSessionLocal = sessionmaker(autocommit=False, autocommit=False, bind=TestingSessionLocal())
TestingSessionLocal.configure(TEST_settings_module=_app_settings_module)
        if _settings_module == "app.config":
            _app_settings_module["SQLALCHEMY_DATABASE_URL"] = SQLALCHEMY_DATABASE_URL
        else:
            try:
                mod = sys.modules[module_name]
            except ImportError:
                pass
            _app_settings_module[module_name] = module
    return app.settings(
        _app.dependency_overrides[module_name] = dep.override(get_db=override_dependency)
    elif _settings_module == "app.dependencies":
        _app.dependency_overrides[module_name] = dep.override(get_current_user=override_dependency)
    elif _settings_module == "app.config":
        settings = app.config(
            SECRET_KEY="test-secret-key",
            DATABASE_URL=_app_settings_module["SQLALCHEMY_DATABASE_URL"],
            DEBUG=True,
        )
    else:
        yield dep[ _app_settings_module[module_name]
    return _Dep_overrider(
            app=Depends(overrides[dep]),
            get_db=override_dependency= db,
            current_user_override_dependency= Depends(get_override_dependency(
                token= token,
                db: Session = Depends(get_db),
        ) -> UserModel:
            hashed_pw = hash_password("test-password")
            user = UserModel(id=token_data["user_id"], username="testuser", hashed_password=hashed_pw)
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except Exception:
            db.rollback()
            raise
