# ================================
# TESTES DA API GODOFREDA
# ================================

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Testa o endpoint raiz"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Godofreda API" in data["message"]

def test_health_endpoint():
    """Testa o endpoint de health check"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_metrics_endpoint():
    """Testa o endpoint de métricas"""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]

def test_personality_endpoint():
    """Testa o endpoint de personalidade"""
    response = client.get("/personality")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Godofreda"

def test_chat_endpoint_invalid_input():
    """Testa o endpoint de chat com entrada inválida"""
    response = client.post("/chat", data={"user_input": ""})
    assert response.status_code == 400

def test_falar_endpoint_invalid_input():
    """Testa o endpoint de TTS com entrada inválida"""
    response = client.post("/falar", data={"texto": ""})
    assert response.status_code == 400 