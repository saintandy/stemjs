import {StyleSet, styleRule} from "../Style";

class InputStyle extends StyleSet {
    @styleRule
    inputElement = {
        transition: "border-color ease-in-out .15s, box-shadow ease-in-out .15s",
        padding: "0.4em 0.54em",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "90%",
        ":focus": {
            outline: "0",
            borderColor: "#66afe9",
            boxShadow: "inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6)",
        },
    };

    @styleRule
    checkboxInput = {
        marginLeft: "0.2em",
        display: "inline-block",
        width: "initial !important",
        marginRight:"0.5em",
    };

    @styleRule
    select = {
        height: "2.12em",
    };
}

export {InputStyle};
