let sliderInterval;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//функция плавного подъезжания к следующему кадру
async function glide(el, startOffset, endOffset, duration) {
    if (el === null) return;

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

//функция-замыкание для переключения кадров слайдера
//враппер нужен чтобы при ресайзе окна слайдер не ломался - обновляем значения в метафункции под новые размеры кадров
let nextFrame = nextFrameWrapper();
function nextFrameWrapper() {
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
            clearInterval(sliderInterval);
        }
    });

    //клики по баттонам переключателя слайдов хэндлятся на родителе через bubbling
    document.getElementsByClassName("slider__button-container")[0].addEventListener('click', (e) => {
        if (e.target.classList.contains('slider__button')) {
            let buttonIndex = Array.prototype.indexOf.call(e.target.parentElement.children, e.target);

            clearInterval(sliderInterval);
            //раскрашиваем кнопку под номером активного кадра
            for (let el of e.target.parentElement.children) {
                el.classList.remove('slider__button__displayed');
            }
            if (!e.target.classList.contains('slider__button__displayed')) {
                e.target.classList.add('slider__button__displayed');
            }
            //дисэйблим кнопки во время переезда кадров
            for (let el of e.target.parentElement.children) {
                el.disabled = true;
            }
            setTimeout(function () {
                for (let el of e.target.parentElement.children) {
                    el.disabled = false;
                }
            }, slideDuration)

            glide(frameRow, -frameOffsets[framePosition], -frameOffsets[buttonIndex], slideDuration);
            framePosition = buttonIndex;
        }
    });

    return function () {
        if (frameCount > 1) {
            //если последний кадр - возвращаемся к первому
            if (framePosition === frameCount - 1) {
                glide(frameRow, -frameOffsets[framePosition], -frameOffsets[0], slideDuration);
                //перекрашиваем кнопку соответствующею кадру
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
}

onresize = function () {
    if (typeof sliderInterval !== 'undefined' &&
        document.getElementsByClassName("slider__frame-row")[0] !== 'undefined') {
        clearInterval(sliderInterval);


        nextFrame = nextFrameWrapper();

        document.getElementsByClassName("slider__frame-row")[0].style.left = '0px';

        sliderInterval = setInterval(nextFrame, 5000);
    }
}

onblur = function () {
    //останавливаем показ слайдов при дефокусе окна чтобы не было большой очереди коллбэков 
    //из-за setInterval (будет истеричное перематывание после возвращания к окну)
    if (typeof sliderInterval !== 'undefined') {
        clearInterval(sliderInterval);
    }
}

onfocus = function (e) {
    let inputsEmpty = true;
    //проверяем не ввел ли юзер что-то прежде чем запустить слайдшоу в слайдере при возвращении к окну
    Array.prototype.forEach.call(
        document.getElementsByClassName("slider")[0].getElementsByTagName("INPUT"),
        function (el) {
            if (el.value != '' && el.type == 'text') {
                inputsEmpty = false;
            }
        });
    if (inputsEmpty) {
        sliderInterval = setInterval(nextFrame, 5000);
    }
}

//запускаем слайдшоу
sliderInterval = setInterval(nextFrame, 5000);

//функция горизонтального скролла cases__panel в мобильной и планшетной версии
if (typeof document.getElementsByClassName("cases__panel")[0] !== 'undefined') {
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
}


//функции для мобильной менюшки
if (typeof document.getElementsByClassName("header__burger")[0] !== 'undefined' &&
    typeof document.getElementsByClassName("mobile-navscreen")[0] !== 'undefined') {
    document.getElementsByClassName("header__burger")[0].children[0].onchange = function (e) {
        if (document.getElementsByClassName("mobile-navscreen")[0].style.display != "block") {
            document.getElementsByClassName("mobile-navscreen")[0].style.display = "block";
        }
        else {
            document.getElementsByClassName("mobile-navscreen")[0].style.display = "none";
        }
    }

    document.getElementsByClassName("mobile-navscreen")[0].children[0].onchange = function (e) {
        if (document.getElementsByClassName("mobile-navscreen")[0].style.display != "block") {
            document.getElementsByClassName("mobile-navscreen")[0].style.display = "block";
        }
        else {
            document.getElementsByClassName("mobile-navscreen")[0].style.display = "none";

        }
    }
    document.getElementsByClassName("mobile-navscreen")[0].onclick = function (e) {
        document.getElementsByClassName("header__burger")[0].children[0].checked = false;
        document.getElementsByClassName("mobile-navscreen")[0].style.display = "none";
    }
}


//функции для форм
if (typeof document.getElementById('footer__form') !== 'undefined') {
    document.getElementById('footer__form').onsubmit = function (e) {
        e.preventDefault();

        if (isValidEmail(e.target[1].value)) {
            alert(`Form data:\nName: ${e.target[0].value}\nE-Mail: ${e.target[1].value}\nInfo: ${e.target[2].value}`);

            for (let el of e.target.children) {
                el.style.display = 'none';
            }
            document.getElementById('footer__form-p').style.display = 'block';
        }
        else {
            alert('Введите корректный e-mail');
        }

        return false;
    }
}

if (typeof document.forms !== 'undefined') {
    for (let f of document.forms) {
        if (f.id != 'footer__form') {
            f.onsubmit = function (e) {
                e.preventDefault();

                if (isValidEmail(e.target[0].value)) {
                    e.target[0].style.display = 'none';
                    e.target[1].style.display = 'none';
                    e.target.children[0].style.display = 'block';
                }
                else {
                    alert('Введите корректный e-mail');
                }

                return false;
            }
        }
    }
}

function isValidEmail(email) {
    const regExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    return regExp.test(email);
}

document.getElementById('header__button').onclick = function() {
    scrollTo(0, document.body.scrollHeight);
}