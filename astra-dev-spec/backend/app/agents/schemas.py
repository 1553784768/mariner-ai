from typing import Literal
from pydantic import BaseModel, Field
from app.api.schemas import Evidence, LegalStatus, RuleChange


class TriageResult(BaseModel):
    document_number: str
    relevant: bool
    category: Literal["rate_change", "exclusion", "scope_change", "procedure", "fee", "refund",
                      "investigation", "negotiation", "comment_request", "adcvd", "needs_fulltext", "irrelevant"]
    programs: list[Literal["SEC301", "SEC232", "SEC122", "IEEPA", "ADCVD", "DE_MINIMIS", "FEES", "OTHER"]]
    countries: list[str]
    legal_status: LegalStatus | None
    needs_fulltext: bool
    one_line_zh: str = Field(max_length=60)
    evidence: list[Evidence] = Field(min_length=1)
    confidence: float = Field(ge=0, le=1)


class ExtractionResult(BaseModel):
    document_number: str
    legal_status: LegalStatus
    change: RuleChange
    summary_zh: str = Field(max_length=120)
    evidence: list[Evidence]
