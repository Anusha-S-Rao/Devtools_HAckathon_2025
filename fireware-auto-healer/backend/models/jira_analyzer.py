import os
import json
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from sentence_transformers import SentenceTransformer, util

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "jira-summary-model")
KNOWN_ISSUES_PATH = os.path.join(BASE_DIR, "existing_issues.jsonl")
FALLBACK_MODEL_NAME = os.environ.get("JIRA_SUMMARY_MODEL", "google/flan-t5-base")


def _load_summarizer():
    model_source = MODEL_PATH if os.path.isdir(MODEL_PATH) else FALLBACK_MODEL_NAME
    model = T5ForConditionalGeneration.from_pretrained(model_source)
    tok = T5Tokenizer.from_pretrained(model_source)
    return model, tok


def _load_issue_corpus():
    if os.path.exists(KNOWN_ISSUES_PATH):
        with open(KNOWN_ISSUES_PATH, "r", encoding="utf-8") as f:
            return [json.loads(line) for line in f]
    # Fallback corpus
    return [
        {"id": "FW-1001", "summary": "Bootloader panic after OTA package validation"},
        {"id": "FW-1020", "summary": "Memory leak during TLS handshake on ARM targets"},
        {"id": "FW-1103", "summary": "Watchdog reset triggered while mounting filesystem"},
    ]


summarizer, tokenizer = _load_summarizer()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
summarizer = summarizer.to(device)

sim_device = "cuda" if torch.cuda.is_available() else "cpu"
sim_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2", device=sim_device)

issue_data = _load_issue_corpus()
summaries = [item["summary"] for item in issue_data]
ids = [item["id"] for item in issue_data]
jira_embeddings = sim_model.encode(summaries, convert_to_tensor=True)

def analyze_jira_issue(description):
    # Generate summary
    inputs = tokenizer("summarize: " + description, return_tensors="pt", truncation=True, max_length=512).to(device)
    output = summarizer.generate(
        **inputs,
        max_length=80,
        num_beams=4,
        early_stopping=True
    )
    new_summary = tokenizer.decode(output[0], skip_special_tokens=True)

    # Embed summary and compare
    query_embedding = sim_model.encode([new_summary], convert_to_tensor=True)
    scores = util.cos_sim(query_embedding, jira_embeddings)[0]
    top_k = 3
    top_results = torch.topk(scores, k=min(top_k, len(scores)))

    similar = []
    for score, idx in zip(top_results.values, top_results.indices):
        similar.append({
            'id': ids[idx],
            'title': summaries[idx],
            'similarity': round(float(score)*100, 2)
        })

    return {
        'summary': new_summary,
        'similarIssues': similar
    }