import axios from "axios";
import config from "../config.json";

export function requestCheckLogin(cb) {
    axios.post(config.BASE_URL + "/check-login")
    .then(response => {
        if (response.data.status === "OK") {
            cb(true);
        } else {
            cb(false);
        }
    })
    .catch(error => {
        cb(false);
    });
}