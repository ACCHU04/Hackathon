# Evaluation Metrics

## Claim Extraction

| Metric | Formula | Target |
|--------|---------|--------|
| Precision | TP / (TP + FP) | > 0.85 |
| Recall | TP / (TP + FN) | > 0.80 |
| F1 | 2 × P × R / (P + R) | > 0.82 |

A "true positive" is an extracted claim that matches a gold annotation claim
(using exact string match or ≥ 0.8 BERTScore similarity).

## Verdict Classification

Evaluated on FEVER (3-class) and LIAR (6-class collapsed to 4).

| Metric | Formula |
|--------|---------|
| Macro-F1 | Average F1 across all verdict labels |
| Accuracy | Correct predictions / Total predictions |
| Label Agreement (Cohen's κ) | Inter-annotator agreement proxy |

## Evidence Retrieval

| Metric | Description |
|--------|-------------|
| MRR | Mean Reciprocal Rank of first correct evidence URL |
| NDCG@5 | Normalized Discounted Cumulative Gain at rank 5 |
| Recall@10 | % of gold evidence URLs present in top-10 results |
