import sys

def search_in_pi(query, context_size=20):
    # read pi file
    with open('10000000.txt', 'r') as f:
        pi_data = f.read().strip()
    
    # remove "3." at the beginning for accurate decimal positioning
    if pi_data.startswith('3.'):
        pi_digits = pi_data[2:]
    else:
        pi_digits = pi_data

    idx = pi_digits.find(query)
    
    if idx == -1:
        print(f"Could not find {query} in the first {len(pi_digits)} digits of Pi.")
        return
        
    start_idx = max(0, idx - context_size)
    end_idx = min(len(pi_digits), idx + len(query) + context_size)
    
    context = pi_digits[start_idx:end_idx]
    
    print(f"Found {query} at decimal position {idx + 1}")
    print(f"Context: {context}")
    
    # Highlight query in context
    highlighted = pi_digits[start_idx:idx] + f"[{query}]" + pi_digits[idx + len(query):end_idx]
    print(f"Highlighted: {highlighted}")

if __name__ == '__main__':
    search_in_pi(sys.argv[1])
