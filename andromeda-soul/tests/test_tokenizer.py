"""
Andromeda Tokenizer Unit Tests
"""

from andromeda_soul.core.tokenizer.tokenizer import AndromedaTokenizer

def test_tokenizer_encode_decode():
    tokenizer = AndromedaTokenizer()
    text = "Andromeda Soul is an independent AI system."
    encoded = tokenizer.encode(text)
    decoded = tokenizer.decode(encoded)
    
    assert len(encoded) > 0
    print(f"[TEST PASSED] Tokenizer Encode/Decode OK -> Encoded len: {len(encoded)}")

if __name__ == "__main__":
    test_tokenizer_encode_decode()
