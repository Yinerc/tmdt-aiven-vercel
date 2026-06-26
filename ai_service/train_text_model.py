from __future__ import annotations

from pathlib import Path

from datasets import load_dataset
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)


BASE_MODEL = "google/flan-t5-small"
DATA_FILE = "data/ai_dataset.jsonl"
OUTPUT_DIR = "models/text-generator"
MAX_INPUT_LENGTH = 1024
MAX_TARGET_LENGTH = 768


def main():
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    dataset = load_dataset("json", data_files=DATA_FILE, split="train")
    dataset = dataset.train_test_split(test_size=0.1, seed=42)

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)

    def preprocess(batch):
        inputs = tokenizer(
            batch["input"],
            max_length=MAX_INPUT_LENGTH,
            truncation=True,
        )
        labels = tokenizer(
            batch["output"],
            max_length=MAX_TARGET_LENGTH,
            truncation=True,
        )
        inputs["labels"] = labels["input_ids"]
        return inputs

    tokenized = dataset.map(preprocess, batched=True, remove_columns=dataset["train"].column_names)

    args = Seq2SeqTrainingArguments(
        output_dir=OUTPUT_DIR,
        learning_rate=5e-5,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        num_train_epochs=3,
        save_strategy="epoch",
        eval_strategy="epoch",
        logging_steps=10,
        predict_with_generate=True,
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["test"],
        tokenizer=tokenizer,
        data_collator=DataCollatorForSeq2Seq(tokenizer, model=model),
    )

    trainer.train()
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)


if __name__ == "__main__":
    main()
