from app.common.schemas import AppBaseModel


class TribeAdvantageOut(AppBaseModel):
    id: int
    code: str
    title: str
    description: str | None = None
    position: int


class TribeBase(AppBaseModel):
    name: str
    description: str | None = None
    playstyle: str | None = None


class TribeOut(TribeBase):
    id: int
    advantages: list[TribeAdvantageOut]