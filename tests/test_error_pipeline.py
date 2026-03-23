import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Ajusta o path para importar o backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from fastapi.testclient import TestClient
from main import app, client, AppBaseException, ProviderQuotaException

class TestErrorPipeline(unittest.TestCase):
    def setUp(self):
        # Evita propagar exceção interna travando o cliente de testes
        self.client = TestClient(app, raise_server_exceptions=False)

    def test_scenario_a_rate_limit(self):
        """Cenário A: Simular um erro 429 (Rate Limit) do Gemini"""
        from google.genai.errors import ServerError
        import main
        
        original_client = main.client
        main.client = MagicMock()
        
        mock_chat = MagicMock()
        mock_chat.send_message.side_effect = ServerError({'error': 'quota'}, 429)
        main.client.chats.create.return_value = mock_chat

        try:
            payload = {"message": "Quero um microondas", "history": []}
            response = self.client.post("/chat", json=payload)
            self.assertEqual(response.status_code, 429, msg=f"Body: {response.json()}")
        finally:
            main.client = original_client

    def test_scenario_b_generic_500(self):
        """Cenário B: Simular um erro 500 (Erro Interno) que não deve vazar segredos"""
        import main
        original_client = main.client
        main.client = MagicMock()
        
        mock_chat = MagicMock()
        mock_chat.send_message.side_effect = Exception("CONEXAO_BANCO_DE_DADOS_SENHA_123")
        main.client.chats.create.return_value = mock_chat

        try:
            payload = {"message": "Oi", "history": []}
            response = self.client.post("/chat", json=payload)
            self.assertEqual(response.status_code, 500)
            
            data = response.json()
            # Não deve haver o texto da exceção
            self.assertNotIn("CONEXAO_BANCO_DE_DADOS_SENHA_123", str(data))
            self.assertEqual(data["error_code"], "INTERNAL_ERROR")
        finally:
            main.client = original_client

    @patch('main.time.time')
    @patch('main.requests.get')
    def test_scenario_c_latency_logging(self, mock_get, mock_time):
        """Cenário C: Validar se o cálculo de latência está funcionando"""
        # Simula tempo 1000s e depois 1002s (2000ms de atraso)
        mock_time.side_effect = [1000.0, 1002.0]
        
        # Simula resposta OK da serpapi
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_index = 0
        mock_response.json.return_value = {"shopping_results": []}
        mock_get.return_value = mock_response

        # Chama a Tool diretamente para testar o decorator
        from main import search_google_shopping
        
        with self.assertLogs('gabi_shopper_api', level='INFO') as log_capture:
            search_google_shopping("geladeira")
            
        # Verifica se o log imprimiu o tempo (2s = 2000ms)
        log_output = "\n".join(log_capture.output)
        self.assertIn("LATENCY:2000", log_output)
        self.assertIn("PROVIDER_SUCCESS:SerpApi_Shopping", log_output)

if __name__ == "__main__":
    unittest.main()
