#!/usr/bin/env python3
"""
Summarizer Script
=================
A standalone Python script that summarizes text using extractive summarization.
No external ML libraries required - uses only standard Python libraries.
Fully local, free, and works offline.

Requirements:
    Python 3.7+ (no additional packages needed)

Usage:
    echo '{"text": "Your article text here..."}' | python3 summarizer.py
"""

import json
import sys
import re
from collections import Counter


def preprocess_text(text):
    """
    Clean and preprocess the input text.
    
    Args:
        text (str): Raw input text
    
    Returns:
        str: Cleaned text
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def split_sentences(text):
    """
    Split text into sentences using punctuation marks.
    
    Args:
        text (str): Input text
    
    Returns:
        list: List of sentences
    """
    # Split on sentence-ending punctuation
    sentences = re.split(r'[.!?]+\s+', text)
    # Filter out empty sentences
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences


def calculate_word_frequencies(text):
    """
    Calculate word frequencies in the text (excluding common stop words).
    
    Args:
        text (str): Input text
    
    Returns:
        dict: Word frequency dictionary
    """
    # Common stop words to exclude
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
        'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
        'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
    }
    
    # Convert to lowercase and split into words
    words = re.findall(r'\b[a-z]+\b', text.lower())
    # Filter out stop words and short words
    words = [w for w in words if w not in stop_words and len(w) > 2]
    # Count word frequencies
    word_freq = Counter(words)
    return word_freq


def score_sentences(sentences, word_freq):
    """
    Score sentences based on word frequencies.
    
    Args:
        sentences (list): List of sentences
        word_freq (dict): Word frequency dictionary
    
    Returns:
        list: List of (sentence, score) tuples
    """
    sentence_scores = []
    
    for sentence in sentences:
        # Calculate sentence score as sum of word frequencies
        words = re.findall(r'\b[a-z]+\b', sentence.lower())
        score = sum(word_freq.get(word, 0) for word in words)
        # Normalize by sentence length (to avoid favoring long sentences)
        sentence_length = len(words)
        if sentence_length > 0:
            score = score / sentence_length
        sentence_scores.append((sentence, score))
    
    return sentence_scores


def summarize_text(text, max_length=150, min_length=40):
    """
    Summarize the input text using extractive summarization.
    
    Args:
        text (str): The text to summarize
        max_length (int): Maximum length of the summary in words
        min_length (int): Minimum length of the summary in words
    
    Returns:
        str: The summarized text
    """
    # Preprocess the text
    text = preprocess_text(text)
    
    if not text:
        raise ValueError("Empty text provided")
    
    # Split into sentences
    sentences = split_sentences(text)
    
    if not sentences:
        raise ValueError("No sentences found in text")
    
    # If text is already short, return as-is
    word_count = len(text.split())
    if word_count <= max_length:
        return text
    
    # Calculate word frequencies
    word_freq = calculate_word_frequencies(text)
    
    if not word_freq:
        # Fallback: return first few sentences if no meaningful words found
        return ' '.join(sentences[:3])
    
    # Score sentences
    sentence_scores = score_sentences(sentences, word_freq)
    
    # Sort sentences by score (highest first)
    sentence_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Select top sentences until we reach the desired length
    selected_sentences = []
    current_length = 0
    
    for sentence, score in sentence_scores:
        sentence_words = len(sentence.split())
        
        # Check if adding this sentence would exceed max_length
        if current_length + sentence_words > max_length:
            # If we haven't reached min_length, try to add shorter sentences
            if current_length < min_length:
                # Look for shorter sentences that fit
                for shorter_sentence, _ in sentence_scores:
                    shorter_words = len(shorter_sentence.split())
                    if (current_length + shorter_words <= max_length and 
                        shorter_sentence not in selected_sentences):
                        selected_sentences.append(shorter_sentence)
                        current_length += shorter_words
                        break
            break
        
        selected_sentences.append(sentence)
        current_length += sentence_words
    
    # Ensure we have at least min_length words
    if current_length < min_length and sentences:
        # Add more sentences if needed
        for sentence in sentences:
            if sentence not in selected_sentences:
                sentence_words = len(sentence.split())
                if current_length + sentence_words <= max_length:
                    selected_sentences.append(sentence)
                    current_length += sentence_words
                if current_length >= min_length:
                    break
    
    # Join selected sentences
    summary = ' '.join(selected_sentences)
    
    # Ensure summary ends with proper punctuation
    if summary and summary[-1] not in '.!?':
        summary += '.'
    
    return summary.strip()


def main():
    """
    Main function to read JSON from stdin, summarize, and output JSON to stdout.
    """
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        
        if not input_data.strip():
            error_response = {
                "error": "No input provided. Expected JSON format: {\"text\": \"<article_text>\"}"
            }
            print(json.dumps(error_response))
            sys.exit(1)
        
        # Parse the input JSON
        try:
            data = json.loads(input_data)
        except json.JSONDecodeError as e:
            error_response = {
                "error": f"Invalid JSON input: {str(e)}"
            }
            print(json.dumps(error_response))
            sys.exit(1)
        
        # Validate that 'text' field exists
        if "text" not in data:
            error_response = {
                "error": "Missing 'text' field in input. Expected format: {\"text\": \"<article_text>\"}"
            }
            print(json.dumps(error_response))
            sys.exit(1)
        
        text = data["text"]
        
        # Validate that text is not empty
        if not text or not text.strip():
            error_response = {
                "error": "Text field is empty. Please provide text to summarize."
            }
            print(json.dumps(error_response))
            sys.exit(1)
        
        # Summarize the text
        print("Summarizing text...", file=sys.stderr)
        summary = summarize_text(text, max_length=150, min_length=40)
        
        # Output the result as JSON
        output = {
            "summary": summary
        }
        print(json.dumps(output))
        
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        error_response = {
            "error": "Process interrupted by user"
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)
        
    except Exception as e:
        # Handle any other errors
        error_response = {
            "error": str(e)
        }
        print(json.dumps(error_response))
        sys.exit(1)


if __name__ == "__main__":
    main()

