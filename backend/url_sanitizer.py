import re
import urllib.parse
import logging

logger = logging.getLogger("gabi_shopper_api.sanitizer")

def is_hallucinated(url: str) -> bool:
    """Verifica se uma URL apresenta sinais de alucinação."""
    # 1. Tamanho excessivo (alucinação de loop logo ou muitos parametros)
    if len(url) > 200:
        return True
    
    # 2. Loop de caracteres idênticos consecutivos (ex: "000000", "aaaaaa")
    # Captura qualquer caractere que se repita 5 ou mais vezes em sequência
    if re.search(r'(.)\1{5,}', url):
        return True
        
    # 3. Estrutura de marketplace inválida:
    # Muitos links falsos do Gemini falham ao ter um formato de produto
    # Domínios de exemplo que exigem estrutura /p/ ou similar
    # Nota: para simplificar a regra geral, podemos apenas checar se não for um domínio reconhecido com um path mínimo
    # Como as lojas brasileiras geralmente usam slugs ou /p/, vamos validar se pelo menos tem um path válido
    parsed = urllib.parse.urlparse(url)
    if not parsed.netloc:
        return True # Falta o domínio
        
    return False

def generate_safe_search_url(product_name: str) -> str:
    """Gera uma URL de busca genérica (Google ou loja padrão) baseada no nome do produto."""
    # Aqui utilizamos o urllib.parse.quote_plus (que transforma espaços em + ou url_encode adequado)
    safe_term = urllib.parse.quote_plus(product_name)
    # Como fallback seguro, redirecionamos para uma busca no Google Shopping ou similar
    # Caso possua loja específica, pode ser trocado por https://loja.com.br/busca?q=...
    return f"https://www.google.com/search?tbm=shop&q={safe_term}"

def extract_product_name_from_context(text: str, current_url: str) -> str:
    """Tenta extrair o nome do produto próximo à URL para gerar a busca."""
    # Como heurística simples, se o link estiver no formato [Nome do Produto](URL), pegamos o Nome do Produto.
    # Caso seja URL solta, retornaremos um termo genérico, mas na rotina `sanitize_text` nós vamos capturar
    # a tag markdown se existir.
    return "produto ofertado"

def sanitize_text(text: str) -> str:
    """
    Processa o texto de saída da LLM, formata URLs expostas em Markdown e 
    substitui URLs alucinadas pelo fallback de busca.
    """
    if not text:
        return text

    # Passo 1: Converter URLs "nuas" (raw) que NÃO ESTÃO dentro de parênteses/Markdown para o formato Markdown.
    # Procura http/https não antecedido por '(' ou ']' e não seguido por ')'
    # Ex: "Veja isto em https://loja.com" -> "Veja isto em [Clique aqui para ver o item](https://loja.com)"
    
    # regex para encontrar URLs "puras" que não estão no meio de [Texto](URL)
    # lookbehind negativo `(?<!\S)` garante que não estamos no meio de uma tag
    raw_url_pattern = r'(?<![\(\[])(https?:\/\/[^\s<>"]+[^.,;:\s<>"\)\]])'
    
    def raw_url_replacer(match):
        url = match.group(1)
        return f"[Clique aqui para ver o item]({url})"
        
    text = re.sub(raw_url_pattern, raw_url_replacer, text)

    # Passo 2: Analisar todas as tags Markdown [texto](url)
    markdown_link_pattern = r'\[([^\]]+)\]\((https?:\/\/[^\)]+)\)'
    
    def markdown_replacer(match):
        product_text = match.group(1)
        url = match.group(2)
        
        if is_hallucinated(url):
            logger.warning(f"Sanitizer interceptou URL alucinada: {url}. Substituindo por busca.")
            # Se alucinou, substitui pela URL de busca usando o nome capturado no texto do link
            safe_url = generate_safe_search_url(product_text)
            return f"[{product_text}]({safe_url})"
            
        return match.group(0) # Mantém intacto
        
    sanitized_text = re.sub(markdown_link_pattern, markdown_replacer, text)
    
    return sanitized_text

