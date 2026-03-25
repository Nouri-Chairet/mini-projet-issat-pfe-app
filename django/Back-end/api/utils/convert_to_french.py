def convert_to_french(day):
    """
    Convert the day of the week to French.
    """
    days_in_french = {
        "monday": "lundi",
        "tuesday": "mardi",
        "wednesday": "mercredi",
        "thursday": "jeudi",
        "friday": "vendredi",
        "saturday": "samedi",
        "sunday": "dimanche"
    }
    return days_in_french.get(day, day)