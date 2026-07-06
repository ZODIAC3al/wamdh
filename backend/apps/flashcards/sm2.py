import datetime
from config.mongodb import cards_col

RATING_MAP = {"again": 0, "hard": 1, "good": 3, "easy": 5}

def update_card(card, rating_str: str):
    q = RATING_MAP.get(rating_str, 3)
    
    repetitions = card.get("repetitions", 0)
    interval_days = card.get("interval_days", 1)
    ease_factor = card.get("ease_factor", 2.5)

    if q >= 3:
        if repetitions == 0:
            interval_days = 1
        elif repetitions == 1:
            interval_days = 6
        else:
            interval_days = round(interval_days * ease_factor)
        repetitions += 1
    else:
        repetitions = 0
        interval_days = 1
    
    ease_factor = max(1.3, ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    
    next_review = datetime.date.today() + datetime.timedelta(days=interval_days)
    next_review_dt = datetime.datetime.combine(next_review, datetime.time.min)

    updated_fields = {
        "repetitions": repetitions,
        "interval_days": interval_days,
        "ease_factor": ease_factor,
        "next_review": next_review_dt,
        "last_rating": rating_str
    }
    
    cards_col.update_one({"_id": card["_id"]}, {"$set": updated_fields})
    
    card.update(updated_fields)
    return card
