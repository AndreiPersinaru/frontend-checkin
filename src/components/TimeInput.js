import React from "react";

function TimeInput({ value, onChange, name, required }) {
    const handleChange = (e) => {
        let inputValue = e.target.value;

        // Elimină caractere non-numerice și colon
        inputValue = inputValue.replace(/[^\d:]/g, "");

        // Formatul trebuie să fie HH:MM
        if (inputValue.length === 2 && !inputValue.includes(":")) {
            inputValue = inputValue + ":";
        } else if (inputValue.length > 5) {
            inputValue = inputValue.slice(0, 5);
        }

        // Validează orele (0-23) și minutele (0-59)
        if (inputValue.includes(":")) {
            const [hours, minutes] = inputValue.split(":");
            if (hours && minutes) {
                const h = parseInt(hours);
                const m = parseInt(minutes);
                if (h > 23) {
                    inputValue = "23:" + minutes;
                }
                if (m > 59) {
                    inputValue = hours + ":59";
                }
            }
        }

        onChange({
            target: { name, value: inputValue },
        });
    };

    const handleKeyDown = (e) => {
        // Permite doar numere și colon
        if (!/[\d:]/.test(e.key) && !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <input
            type="text"
            name={name}
            className="input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="HH:MM (ex: 14:30)"
            required={required}
            pattern="[0-2][0-9]:[0-5][0-9]"
            maxLength="5"
            style={{
                fontFamily: "monospace",
                letterSpacing: "0.1em",
            }}
        />
    );
}

export default TimeInput;
