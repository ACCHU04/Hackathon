# Evaluation Datasets

## FEVER (Fact Extraction and VERification)

- **Paper**: Thorne et al., 2018 — https://arxiv.org/abs/1803.05355
- **Download**: https://fever.ai/dataset/fever.html
- **Size**: ~185K claims with Wikipedia evidence
- **Labels**: SUPPORTS, REFUTES, NOT ENOUGH INFO
- **Usage**: Place the `train.jsonl`, `shared_task_dev.jsonl` files here.

```
FEVER/
├── train.jsonl
├── shared_task_dev.jsonl
└── shared_task_test.jsonl
```

## LIAR Dataset

- **Paper**: Wang, 2017 — https://arxiv.org/abs/1705.00648
- **Download**: https://www.cs.ucsb.edu/~william/data/liar_dataset.zip
- **Size**: 12.8K statements from PolitiFact
- **Labels**: pants-fire, false, barely-true, half-true, mostly-true, true
- **Usage**: Place the TSV files here.

```
LIAR/
├── train.tsv
├── valid.tsv
└── test.tsv
```

> **Note**: These datasets are NOT committed to the repository due to size.
> Download them separately and place them in the directories above.
