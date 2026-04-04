from pydantic import BaseModel, ConfigDict


class AppBaseModel(BaseModel):
    # Enables returning ORM objects directly in response_model
    model_config = ConfigDict(from_attributes=True, extra="ignore")
