const path = document.querySelector('path');
const label = document.querySelector('label');

function onCheck(cb) {
    if (cb.checked) {
        path.setAttribute('transform', "scale(1,-1) translate(0,-425)");
        label.textContent = "Sad";
    } else {
        path.setAttribute('transform', '');
        label.textContent = "Happy";
    }
}
