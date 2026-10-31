import json
import time
from typing import Literal, Protocol

import httpx
from pydantic import BaseModel, ValidationError

from app.collectors.service import read_fixture


class NoFixture(Exception):
    pass


class LLMClient(Protocol):
    def complete_json(self, *, system: str, user: str, schema: type[BaseModel], fixture_key: str,
                      role: Literal["triage", "extract"]) -> BaseModel: ...


class FixtureLLMClient:
    model = "fixture"
    usage = {}

    def complete_json(self, *, system, user, schema, fixture_key, role):
        value = read_fixture(f"llm/{role}.json").get(fixture_key)
        if value is None:
            raise NoFixture(fixture_key)
        return schema.model_validate(value)


class HttpLLMClient:
    def __init__(self, config, sleep=time.sleep):
        self.config, self.sleep = config, sleep
        self.model, self.usage = config["model"], {}

    def complete_json(self, *, system, user, schema, fixture_key, role):
        url = self.config["base_url"].rstrip("/") + "/chat/completions"
        headers = {"Authorization": f'Bearer {self.config["api_key"]}', "Content-Type": "application/json"}
        system += "\n\nJSON schema:\n" + json.dumps(schema.model_json_schema(), ensure_ascii=False)
        correction_used = transport_used = False
        while True:
            try:
                response = httpx.post(url, headers=headers, timeout=120, json={"model": self.model,
                    "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                    "response_format": {"type": "json_object"}})
                if response.status_code >= 500:
                    response.raise_for_status()
                if response.status_code >= 400:
                    raise ValueError(f"HTTP {response.status_code}: {response.text[:200]}".replace(self.config["api_key"], "****"))
            except (httpx.TransportError, httpx.HTTPStatusError):
                if transport_used:
                    raise ValueError("Model request failed after retry") from None
                transport_used = True
                self.sleep(2)
                continue
            try:
                body = response.json()
                self.usage = body.get("usage", {})
                content = json.loads(body["choices"][0]["message"]["content"])
                return schema.model_validate(content)
            except (ValueError, KeyError, IndexError, ValidationError) as exc:
                if correction_used:
                    raise ValueError("Model response does not match the JSON schema") from None
                correction_used = True
                user += f"\n上次输出不符合要求：{str(exc)[:500]}。只返回符合要求的 JSON。"
