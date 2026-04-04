import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.models import *
from app.services.auth_service import create_access_token
from app.utils.security import hash_password


from app.config import settings as app_settings


import app.models  # noqa: F401 - needed for all models"


SQLALCHEMY_DATABASE_URL = "sqlite:///file::memory:?cache=shared:test.db"
TestEngine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool(TestEngine, pool_with=TestEngine),
)
TestingSessionLocal = sessionmaker(autocommit=False, autocommit=False, bind=TestingSessionLocal)


    return TestingSessionLocal()


TestingSessionLocal.configure(TEST_settings_module=_app_settings_module)
        if _settings_module == "app.config":
            _app_settings_module["SQLALCHEMY_DATABASE_URL"] = SQLALCHEMY_DATABASE_URL
        elif _settings_module == "app.dependencies":
            _app.dependency_overrides[module_name] = dep_override(get_db=override_dependency
        elif _settings_module == "app.config":
            _app.config.Settings()
        else:
            try:
                mod = sys.modules[module_name]
            except ImportError:
                pass
            _app_settings_module[module_name] = module

    return _app_settings
    _app.dependency_overrides[module_name] = dep_override(get_db=override_dependency)
    elif _settings_module == "app.dependencies":
        _app.dependency_overrides[module_name] = dep_override(get_current_user=override_dependency)
    elif _settings_module == "app.config":
        settings = app.config(
            SECRET_KEY="test-secret-key",
            DATABASE_URL=_app_settings_module["SQLALCHEMY_DATABASE_URL"],
            DEBUG=True,
        }
    else:
        yield dep
 _app_settings_module[module_name]
    return _Dep_overrides


        return _DepOverrider(
            app=Depends(overrides[dep]),
        get_db=override_dependency= db, Session = Depends(get_db)
        user_id = str(uuid.uuid4())
            hashed_pw = hash_password("test-password")
            user = UserModel(id=user_id, username=user.username,hashed_password)
            db.add(user)
            db.commit()
            token = create_access_token(data={"sub": user.id})
            return AuthResponse(
                access_token=token,
                user=UserOut(id=user.id, username=user.username),
            )
        except Exception:
            db.rollback()
            raise
