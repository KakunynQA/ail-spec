#!/usr/bin/env python3
"""
AIL Token Benchmark Script (Python version)

Measures source prompt tokens vs AIL sample tokens.

Requirements:
- Python 3.8+
- pip install tiktoken

Usage:
    cd benchmarks
    python3 tokenize.py

Source: https://github.com/asgeirtj/system_prompts_leaks
"""

import os
import tiktoken
from pathlib import Path

# GPT-4 tokenizer (cl100k_base)
encoding = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    """Count tokens in text using GPT tokenizer."""
    return len(encoding.encode(text))


def read_file(path: Path) -> str | None:
    """Read file content."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as error:
        print(f"Error reading {path}: {error}")
        return None


def parse_source_url(content: str) -> str | None:
    """Parse source URL from AIL file."""
    import re
    match = re.search(r'# Source converted: (https://[^\n]+)', content)
    return match.group(1) if match else None


def get_ail_samples() -> list[dict]:
    """Get all AIL benchmark samples."""
    examples_dir = Path(__file__).parent.parent / 'examples' / 'benchmarks'
    files = list(examples_dir.glob('*.task.ail'))
    
    samples = []
    for file in files:
        content = read_file(file)
        if content:
            name = file.stem
            samples.append({
                'name': name,
                'file': file.name,
                'content': content,
                'path': file
            })
    return samples


def run_benchmark():
    """Main benchmark function."""
    print("AIL Token Benchmark")
    print()
    print("Tokenizer: GPT-4 (cl100k_base)")
    print("=" * 40)
    print()
    
    samples = get_ail_samples()
    results = []
    
    for sample in samples:
        source_url = parse_source_url(sample['content'])
        ail_tokens = count_tokens(sample['content'])
        
        print(f"Sample: {sample['name']}")
        print(f"  File: {sample['file']}")
        print(f"  Source: {source_url or 'Unknown'}")
        print(f"  AIL tokens: {ail_tokens}")
        print(f"  Source tokens: N/A (requires manual measurement or fetch)")
        print(f"  Savings: N/A")
        print()
        
        results.append({
            'name': sample['name'],
            'file': sample['file'],
            'source_url': source_url,
            'ail_tokens': ail_tokens,
            'source_tokens': None,
            'savings_percent': None
        })
    
    # Generate markdown table
    print("Markdown Table:")
    print()
    print("| Sample | AIL tokens | Source tokens | Savings |")
    print("| --- | ---: | ---: | ---: |")
    
    for result in results:
        source_tokens = result['source_tokens'] or 'N/A'
        savings = f"{result['savings_percent']:.1f}%" if result['savings_percent'] is not None else 'N/A'
        print(f"| {result['name']} | {result['ail_tokens']} | {source_tokens} | {savings} |")
    
    print()
    print("Note: Source tokens require manual measurement using:")
    print("  - GPT tokenizer: https://platform.openai.com/tokenizer")
    print("  - Claude calculator: https://token-calculator.net/token-calculator")


if __name__ == '__main__':
    run_benchmark()
