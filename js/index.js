let interval;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//функция плавного подъезжания к следующему кадру
async function glide(el, startOffset, endOffset, duration) {
    let width = Math.abs(endOffset) - Math.abs(startOffset);
    let frameDelay = duration / 60; //interval between frames
    let frameCount = duration / frameDelay;
    let ppf = Math.abs(width) / frameCount; //(shift by х) pixels per frame
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

//переключатель кадров
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
        interval = setInterval(nextFrame, 5000);
    }
}

//запускаем слайдшоу
interval = setInterval(nextFrame, 5000);

//функция горизонтального скролла cases__panel в мобильной и планшетной версии
document.getElementsByClassName("cases__panel")[0].ontouchmove = (function () {
    if (screen.availWidth < 1440) {
        let cXPrev = undefined; //x предыдущего ивента
        document.getElementsByClassName("cases__panel")[0].style.left = '0px';
        return function (e) {
            if (cXPrev === undefined) cXPrev = e.changedTouches[0].clientX;
            else {
                //обнуляем cX когда палец отлипает от экрана
                if (e.type === 'touchend') {
                    cXPrev = undefined;
                    return;
                }
                //проверяем, чтобы левая граница cases__panel не уезжала правее левой границы wrapper'а, a правая левее правой
                if ((parseInt(document.getElementsByClassName("cases__panel")[0].style.left) - cXPrev + e.changedTouches[0].clientX <= 0) &&
                    (document.getElementsByClassName("cases__panel")[0].getBoundingClientRect().right >
                        document.getElementsByClassName("cases__panel")[0].parentElement.getBoundingClientRect().right)) {
                    document.getElementsByClassName("cases__panel")[0].style.left =
                        `${parseInt(document.getElementsByClassName("cases__panel")[0].style.left) - cXPrev + e.changedTouches[0].clientX}px`;
                    cXPrev = e.changedTouches[0].clientX;
                }
                //избавляемся от застревания правой границы cases__panel появляющегося благодаря предыдущему if 
                //когда граница совпадает с родительским элементом
                if (document.getElementsByClassName("cases__panel")[0].getBoundingClientRect().right <=
                    document.getElementsByClassName("cases__panel")[0].parentElement.getBoundingClientRect().right &&
                    (cXPrev - e.changedTouches[0].clientX < 0)) {
                    document.getElementsByClassName("cases__panel")[0].style.left =
                        `${parseInt(document.getElementsByClassName("cases__panel")[0].style.left) - cXPrev + e.changedTouches[0].clientX}px`;
                    cXPrev = e.changedTouches[0].clientX;
                }
            }

            //если резко дернуть блок влево, то правая граница все равно заезжает за правую границу wrapper'a
            //фиксим (если значение левее, то ровняем правые границы)
            if (document.getElementsByClassName("cases__panel")[0].getBoundingClientRect().right <
                document.getElementsByClassName("cases__panel")[0].parentElement.getBoundingClientRect().right) {
                document.getElementsByClassName("cases__panel")[0].style.left =
                    `-${document.getElementsByClassName("cases__panel")[0].getBoundingClientRect().width -
                    document.getElementsByClassName("cases__panel")[0].parentElement.getBoundingClientRect().width}px`;
            }

            //далее перекрашиваются круглишки под панелью в зависимости от того насколько проскроллено
            let maxOffsetLeft = document.getElementsByClassName("cases__panel")[0].getBoundingClientRect().width -
                document.getElementsByClassName("cases__panel")[0].parentElement.getBoundingClientRect().width + 1;
            let offsetLeft = Math.abs(parseInt(document.getElementsByClassName("cases__panel")[0].style.left));
            let elemCount = document.getElementsByClassName("cases__panel")[0].children.length;

            //удаляем класс раскрашивания со всех круглишков
            for (let el of document.getElementsByClassName("cases__button-container")[0].children) {
                el.classList.remove('cases__button__displayed');
            }
            //раскрашиваем нужный круглишок добавляя класс
            document.getElementsByClassName("cases__button-container")[0].children[Math.floor(offsetLeft / maxOffsetLeft * elemCount)]
                .classList.add('cases__button__displayed');
        }
    }
})()
//передаем в функцию-замыкание (выше) ивент touchend когда он срабатывает
document.getElementsByClassName("cases__panel")[0].ontouchend = document.getElementsByClassName("cases__panel")[0].ontouchmove;


//
document.getElementsByClassName("header__burger")[0].children[0].onchange = function(e) {
    if (document.getElementsByClassName("mobile-navscreen")[0].style.display != "block") {
        document.getElementsByClassName("mobile-navscreen")[0].style.display = "block";
    }
    else {
        document.getElementsByClassName("mobile-navscreen")[0].style.display = "none";
    }
}

document.getElementsByClassName("mobile-navscreen")[0].children[0].onchange = function(e) {
    if (document.getElementsByClassName("mobile-navscreen")[0].style.display != "block") {
        document.getElementsByClassName("mobile-navscreen")[0].style.display = "block";
    }
    else {
        document.getElementsByClassName("mobile-navscreen")[0].style.display = "none";

    }
}
document.getElementsByClassName("mobile-navscreen")[0].onclick = function () {
    document.getElementsByClassName("header__burger")[0].children[0].checked = false;
    document.getElementsByClassName("mobile-navscreen")[0].style.display = "none";
}