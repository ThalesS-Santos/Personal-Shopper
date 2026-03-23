import unittest
from url_sanitizer import sanitize_text, is_hallucinated, generate_safe_search_url

class TestUrlSanitizer(unittest.TestCase):

    def test_scenario_a_hallucinated_loop(self):
        # Cenário A: Alucinação com loop de caracteres repetitivos (ex: "000000")
        input_text = "Veja este produto no site: [Produto Fake](https://loja.com/p/00000000009)"
        expected_domain = "google.com/search?tbm=shop"
        result = sanitize_text(input_text)
        
        # O link deve ser substituido pela busca com fallback
        self.assertIn(expected_domain, result)
        self.assertNotIn("00000000009", result)

    def test_scenario_b_raw_link(self):
        # Cenário B: Link bruto (nu) sem Markdown
        input_text = "Você pode comprar aqui https://minhaloja.com.br/produto-legal veja os detalhes."
        result = sanitize_text(input_text)
        
        expected_markdown = "[Clique aqui para ver o item](https://minhaloja.com.br/produto-legal)"
        self.assertIn(expected_markdown, result)

    def test_long_url_truncation(self):
        # Url acima de 200 caracteres deve ser convertida para safe search
        long_tail = "a" * 200 # Passando o limite (embora o loop já fosse pegar isso, vou misturar letras pra evitar o regex_loop pegar 1o)
        long_url = f"https://loja.com.br/p/item-valido?tracking=xyz{'abcd'*50}"
        
        input_text = f"Aqui está o link enorme [Meu Produto]({long_url})"
        result = sanitize_text(input_text)
        
        self.assertNotIn(long_url, result)
        self.assertIn("google.com/search", result)

    def test_safe_search_url_encoding(self):
        """Garante que no fallback de busca, o termo seja passado por url_encode/quote."""
        term = "geladeira frost free"
        safe_url = generate_safe_search_url(term)
        self.assertIn("geladeira+frost+free", safe_url)
        # Deve ter convertido espaço em '+' ou %20 

    def test_proper_markdown_preservation(self):
        """Links corretos em Markdown não devem ser alterados."""
        input_text = "Compre a [Geladeira Brastemp](https://loja.brastemp.com.br/geladeira-frost-free/p/123456) na promoção."
        result = sanitize_text(input_text)
        
        self.assertEqual(input_text, result)

if __name__ == '__main__':
    unittest.main()
