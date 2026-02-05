"""
SQLAlchemy 設定
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URI = "sqlite:///./sumapuro.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URI,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """テーブル作成（backdatas のモデルを import してから呼ぶ）"""
    from backdatas import Item  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_db():
    """Flask 用 DB セッション（コンテキストマネージャ）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
