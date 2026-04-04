from app.common.schemas import AppBaseModel


class TribeBase(AppBaseModel):
    name: str  # Romans, Teutons, Gauls


class TribeOut(TribeBase):
    id: int
