//если ввести значение в инпут кадра слайдера и потом сделать блюр-фокус таймер запустится




let interval;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function glide(el, startOffset, endOffset, duration) {
    let width = Math.abs(endOffset) - Math.abs(startOffset);
    let frameDelay = duration / 60; //interval between frames
    let frameCount = duration / frameDelay;
    let ppf = Math.abs(width) / frameCount; //(shift by) pixels per frame
    let i = 0;
    if (width > 0) {
        for (i = startOffset; i > endOffset; i -= ppf) {
            requestAnimationFrame(() => el.style.left = `${i}px`);
            await sleep(frameDelay);
        }
    }
    else {
        for (i = startOffset; i < endOffset; i += ppf) {
            requestAnimationFrame(() => el.style.left = `${i}px`);
            await sleep(frameDelay);
        }
    }
    requestAnimationFrame(() => el.style.left = `${endOffset}px`);
}

//closure-функция для 
const nextFrame = (function () {
    let frameRow;

    if ((frameRow = document.getElementsByClassName("slider__frame-row")[0]) === undefined) {
        return null;
    }

    let slideDuration = 500;
    let framePosition = 0;
    let frameCount = frameRow.children.length;
    let frameOffsets = [];

    for (let i = 0; i < frameCount; i++) {
        frameOffsets.push(frameRow.children[i].offsetLeft);
    }

    frameRow.addEventListener('click', (e) => {
        if (e.target.tagName == 'INPUT') {
            clearInterval(interval);
        }
    });

    document.getElementsByClassName("slider__button-container")[0].addEventListener('click', (e) => {
        if (e.target.classList.contains('slider__button')) {
            let buttonIndex = Array.prototype.indexOf.call(e.target.parentElement.children, e.target);

            clearInterval(interval);

            for (let el of e.target.parentElement.children) {
                el.classList.remove('slider__button__displayed');
            }
            if (!e.target.classList.contains('slider__button__displayed')) {
                e.target.classList.add('slider__button__displayed');
            }

            glide(frameRow, -frameOffsets[framePosition], -frameOffsets[buttonIndex], slideDuration);
            framePosition = buttonIndex;
        }
    });

    onblur = function () {
        //останавливаем показ слайдов при дефокусе окна чтобы не было большой очереди коллбэков 
        //из-за setInterval (будет истеричное перематывание после возвращания к окну)
        clearInterval(interval);
    }

    onfocus = function (e) {
        let inputsEmpty = true;
        //проверяем не ввел ли юзер что-то прежде чем запустить слайдшоу в слайдере при возвращении к окну
        Array.prototype.forEach.call(
            document.getElementsByClassName("slider")[0].getElementsByTagName("INPUT"),
            function (el) {
                if (el.value != '') {
                    inputsEmpty = false;
                }
            });
        if (inputsEmpty) {
            interval = setInterval(nextFrame, 2000);
        }
    }

    return function () {
        if (frameCount > 1) {
            if (framePosition === frameCount - 1) {
                glide(frameRow, -frameOffsets[framePosition], -frameOffsets[0], slideDuration);

                document.getElementsByClassName("slider__button-container")[0]
                    .children[framePosition].classList.remove("slider__button__displayed");
                framePosition = 0;
                document.getElementsByClassName("slider__button-container")[0]
                    .children[framePosition].classList.add("slider__button__displayed");
            }
            else {
                glide(frameRow, -frameOffsets[framePosition], -frameOffsets[framePosition + 1], slideDuration);

                document.getElementsByClassName("slider__button-container")[0]
                    .children[framePosition].classList.remove("slider__button__displayed");
                framePosition++;
                document.getElementsByClassName("slider__button-container")[0]
                    .children[framePosition].classList.add("slider__button__displayed");
            }
        }
    }
})();

interval = setInterval(nextFrame, 2000);