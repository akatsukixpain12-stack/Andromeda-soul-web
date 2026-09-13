import os
import sys
import json
import math

DATASET_FILE = os.path.join(os.path.dirname(__file__), 'dataset.json')
WEIGHTS_FILE = os.path.join(os.path.dirname(__file__), 'weights.json')

DEFAULT_DATASET = [
    {"text": "hello andromeda", "label": "greeting"},
    {"text": "hi there system", "label": "greeting"},
    {"text": "how are you", "label": "greeting"},
    {"text": "this is amazing code", "label": "positive"},
    {"text": "i love this application", "label": "positive"},
    {"text": "sovereign studio is great", "label": "positive"},
    {"text": "this is not working", "label": "negative"},
    {"text": "terrible shell crash", "label": "negative"},
    {"text": "worst system error", "label": "negative"},
    {"text": "execute bash script", "label": "command"},
    {"text": "run pytorch training", "label": "command"},
    {"text": "open terminal console", "label": "command"}
]

def load_dataset():
    if not os.path.exists(DATASET_FILE):
        with open(DATASET_FILE, 'w') as f:
            json.dump(DEFAULT_DATASET, f, indent=2)
        return DEFAULT_DATASET
    try:
        with open(DATASET_FILE, 'r') as f:
            return json.load(f)
    except:
        return DEFAULT_DATASET

def save_dataset(data):
    with open(DATASET_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# --- NLP HELPERS (Bag of Words) ---
def tokenize(text):
    return [w.lower() for w in text.split() if len(w) > 1]

def build_vocab(dataset):
    vocab = set()
    for item in dataset:
        for word in tokenize(item['text']):
            vocab.add(word)
    return sorted(list(vocab))

def text_to_bow(text, vocab):
    tokens = tokenize(text)
    vector = [0.0] * len(vocab)
    for token in tokens:
        if token in vocab:
            vector[vocab.index(token)] += 1.0
    return vector

# --- PYTORCH REAL ML IMPLEMENTATION ---
def train_pytorch(dataset, vocab, labels, epochs=100, lr=0.01):
    import torch
    import torch.nn as nn
    import torch.optim as optim

    print("[Real PyTorch Core] Initializing PyTorch MLP Classifier Module...")
    
    input_size = len(vocab)
    hidden_size = 16
    num_classes = len(labels)

    class PyTorchMLP(nn.Module):
        def __init__(self, input_dim, hidden_dim, output_dim):
            super(PyTorchMLP, self).__init__()
            self.linear1 = nn.Linear(input_dim, hidden_dim)
            self.relu = nn.ReLU()
            self.linear2 = nn.Linear(hidden_dim, output_dim)
            self.softmax = nn.Softmax(dim=1)
            
        def forward(self, x):
            out = self.linear1(x)
            out = self.relu(out)
            out = self.linear2(out)
            return self.softmax(out)

    # Prepare tensors
    X_data = []
    Y_data = []
    for item in dataset:
        X_data.append(text_to_bow(item['text'], vocab))
        Y_data.append(labels.index(item['label']))

    X_tensor = torch.tensor(X_data, dtype=torch.float32)
    Y_tensor = torch.tensor(Y_data, dtype=torch.long)

    model = PyTorchMLP(input_size, hidden_size, num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)

    epoch_logs = []
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(X_tensor)
        loss = criterion(outputs, Y_tensor)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 10 == 0 or epoch == 0:
            loss_val = float(loss.item())
            # Calculate accuracy
            _, predicted = torch.max(outputs, 1)
            correct = (predicted == Y_tensor).sum().item()
            accuracy = correct / len(Y_tensor)
            print(f"| Epoch {epoch+1:03d}/{epochs:03d} | Loss: {loss_val:.6f} | Accuracy: {accuracy*100:.1f}% |")
            epoch_logs.append({"epoch": epoch+1, "loss": loss_val, "accuracy": accuracy})

    # Save pytorch weights state dict to files for portability
    state = {
        'vocab': vocab,
        'labels': labels,
        'weights1': model.linear1.weight.detach().tolist(),
        'bias1': model.linear1.bias.detach().tolist(),
        'weights2': model.linear2.weight.detach().tolist(),
        'bias2': model.linear2.bias.detach().tolist(),
        'backend': 'pytorch'
    }
    with open(WEIGHTS_FILE, 'w') as f:
        json.dump(state, f, indent=2)
        
    print("[PyTorch Core] Neural Network model trained successfully and saved weights to weights.json")
    return epoch_logs


# --- PURE PYTHON STANDALONE MLP FALLBACK ---
# Built to replicate PyTorch training math (backpropagation, Swish/ReLU, SGD optimizer)
def train_pure_python(dataset, vocab, labels, epochs=100, lr=0.1):
    print("[Pure Python Core] Initializing NumPy-style backpropagation neural network model...")
    input_size = len(vocab)
    hidden_size = 16
    num_classes = len(labels)

    # Initialize random weights using Xavier/Glorot-style initialization
    import random
    random.seed(42)
    
    def rand_val(fan_in):
        limit = math.sqrt(6.0 / fan_in)
        return random.uniform(-limit, limit)

    w1 = [[rand_val(input_size) for _ in range(input_size)] for _ in range(hidden_size)]
    b1 = [0.0] * hidden_size
    w2 = [[rand_val(hidden_size) for _ in range(hidden_size)] for _ in range(num_classes)]
    b2 = [0.0] * num_classes

    X_data = []
    Y_data = []
    for item in dataset:
        X_data.append(text_to_bow(item['text'], vocab))
        Y_data.append(labels.index(item['label']))

    epoch_logs = []
    for epoch in range(epochs):
        total_loss = 0.0
        correct_preds = 0

        # Run stochastic gradient descent (SGD) over items
        for i in range(len(X_data)):
            x = X_data[i]
            target_idx = Y_data[i]

            # 1. Forward Pass
            # Hidden layer with ReLU activation
            h = [0.0] * hidden_size
            for h_idx in range(hidden_size):
                val = sum(x[in_idx] * w1[h_idx][in_idx] for in_idx in range(input_size)) + b1[h_idx]
                h[h_idx] = max(0.0, val) # ReLU

            # Output layer with Softmax
            logits = [0.0] * num_classes
            for o_idx in range(num_classes):
                logits[o_idx] = sum(h[h_idx] * w2[o_idx][h_idx] for h_idx in range(hidden_size)) + b2[o_idx]
            
            # Stable Softmax
            max_logit = max(logits)
            exp_logits = [math.exp(l - max_logit) for l in logits]
            sum_exp = sum(exp_logits)
            probs = [e / sum_exp for e in exp_logits]

            # Categorical cross entropy loss
            total_loss += -math.log(max(probs[target_idx], 1e-15))
            
            # Count correct
            predicted_idx = probs.index(max(probs))
            if predicted_idx == target_idx:
                correct_preds += 1

            # 2. Backward Pass (Backprop)
            # Output error (d_logits = probs - target)
            d_logits = [p for p in probs]
            d_logits[target_idx] -= 1.0

            # Gradients for second layer
            dw2 = [[0.0] * hidden_size for _ in range(num_classes)]
            db2 = [0.0] * num_classes
            dh = [0.0] * hidden_size

            for o_idx in range(num_classes):
                db2[o_idx] += d_logits[o_idx]
                for h_idx in range(hidden_size):
                    dw2[o_idx][h_idx] += d_logits[o_idx] * h[h_idx]
                    dh[h_idx] += d_logits[o_idx] * w2[o_idx][h_idx]

            # Backprop through ReLU
            for h_idx in range(hidden_size):
                if h[h_idx] <= 0:
                    dh[h_idx] = 0.0

            # Gradients for first layer
            dw1 = [[0.0] * input_size for _ in range(hidden_size)]
            db1 = [0.0] * hidden_size
            for h_idx in range(hidden_size):
                db1[h_idx] += dh[h_idx]
                for in_idx in range(input_size):
                    dw1[h_idx][in_idx] += dh[h_idx] * x[in_idx]

            # Apply gradient updates
            for o_idx in range(num_classes):
                b2[o_idx] -= lr * db2[o_idx]
                for h_idx in range(hidden_size):
                    w2[o_idx][h_idx] -= lr * dw2[o_idx][h_idx]

            for h_idx in range(hidden_size):
                b1[h_idx] -= lr * db1[h_idx]
                for in_idx in range(input_size):
                    w1[h_idx][in_idx] -= lr * dw1[h_idx][in_idx]

        avg_loss = total_loss / len(X_data)
        accuracy = correct_preds / len(X_data)

        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"| Epoch {epoch+1:03d}/{epochs:03d} | Loss: {avg_loss:.6f} | Accuracy: {accuracy*100:.1f}% |")
            epoch_logs.append({"epoch": epoch+1, "loss": avg_loss, "accuracy": accuracy})

    # Save trained pure python parameters
    state = {
        'vocab': vocab,
        'labels': labels,
        'weights1': w1,
        'bias1': b1,
        'weights2': w2,
        'bias2': b2,
        'backend': 'pure_python'
    }
    with open(WEIGHTS_FILE, 'w') as f:
        json.dump(state, f, indent=2)

    print("[Pure Python Core] Neural Network model trained successfully and saved weights to weights.json")
    return epoch_logs


# --- INFERENCE RUNNER ---
def predict(text):
    if not os.path.exists(WEIGHTS_FILE):
        print(json.dumps({"error": "No weights.json file found. Please run training model first to calibrate neural nodes!"}))
        return

    with open(WEIGHTS_FILE, 'r') as f:
        weights = json.load(f)

    vocab = weights['vocab']
    labels = weights['labels']
    w1 = weights['weights1']
    b1 = weights['bias1']
    w2 = weights['weights2']
    b2 = weights['bias2']
    backend = weights.get('backend', 'pure_python')

    # Convert text to Bag of Words
    x = text_to_bow(text, vocab)
    input_size = len(vocab)
    hidden_size = len(b1)
    num_classes = len(b2)

    # Forward pass
    # Hidden layer ReLU
    h = [0.0] * hidden_size
    for h_idx in range(hidden_size):
        val = sum(x[in_idx] * w1[h_idx][in_idx] for in_idx in range(input_size)) + b1[h_idx]
        h[h_idx] = max(0.0, val)

    # Output Layer with Softmax
    logits = [0.0] * num_classes
    for o_idx in range(num_classes):
        logits[o_idx] = sum(h[h_idx] * w2[o_idx][h_idx] for h_idx in range(hidden_size)) + b2[o_idx]

    max_logit = max(logits)
    exp_logits = [math.exp(l - max_logit) for l in logits]
    sum_exp = sum(exp_logits)
    probs = [e / sum_exp for e in exp_logits]

    # Find highest probability match
    max_prob = max(probs)
    class_idx = probs.index(max_prob)
    predicted_label = labels[class_idx]

    # Zip output confidence scores
    confidences = {}
    for idx, prob in enumerate(probs):
        confidences[labels[idx]] = round(prob * 100, 2)

    output = {
        "text": text,
        "prediction": predicted_label,
        "confidence": round(max_prob * 100, 2),
        "confidences": confidences,
        "backend": backend,
        "vocab_matches": sum(1 for v in x if v > 0),
        "vocab_size": len(vocab)
    }
    print(json.dumps(output, indent=2))
    return output


# --- MAIN CLI HANDLER ---
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Andromeda Sovereign ML Console usage: python learning_node.py [train/predict/add/list]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    
    if cmd == 'train':
        dataset = load_dataset()
        vocab = build_vocab(dataset)
        labels = list(set(item['label'] for item in dataset))
        
        print(f"==========================================================")
        print(f" ANDROMEDA SOVEREIGN NEURAL NODE — LIVE MACHINE LEARNING")
        print(f"==========================================================")
        print(f"• Vocab Dimension size: {len(vocab)}")
        print(f"• Dataset Training samples: {len(dataset)}")
        print(f"• Class Labels catalog: {labels}")
        
        # Determine if PyTorch is available
        has_torch = False
        try:
            import torch
            has_torch = True
        except ImportError:
            has_torch = False

        if has_torch:
            train_pytorch(dataset, vocab, labels)
        else:
            train_pure_python(dataset, vocab, labels)

    elif cmd == 'predict':
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Prediction text argument is missing"}))
            sys.exit(1)
        text = sys.argv[2]
        predict(text)

    elif cmd == 'add':
        if len(sys.argv) < 4:
            print("Usage: python learning_node.py add \"textphrase\" \"label\"")
            sys.exit(1)
        text = sys.argv[2]
        label = sys.argv[3]
        
        dataset = load_dataset()
        dataset.append({"text": text, "label": label})
        save_dataset(dataset)
        print(f"Successfully recorded training entry node: \"{text}\" -> category: \"{label}\"")

    elif cmd == 'list':
        dataset = load_dataset()
        print(json.dumps(dataset, indent=2))
