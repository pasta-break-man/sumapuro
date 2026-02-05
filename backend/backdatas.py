"""
SQLAlchemy モデル（オブジェクト中身＝名前・分類・数 を保存）
"""
from sqlalchemy import Column, Integer, String

from database import Base


class Item(Base):
    """オブジェクト中身1行（キャンバス上のどのオブジェクトに属するかは storage_id）"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True, default="")
    category = Column(String, index=True, default="")
    count = Column(Integer, default=0)
    storage_id = Column(String, index=True)  # キャンバス上のオブジェクト id（例: shelf-small-1234567890）
