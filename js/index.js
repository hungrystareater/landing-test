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
            sliderInterval = undefined;
        }
    });

    //клики по баттонам переключателя слайдов хэндлятся на родителе через bubbling
    document.getElementsByClassName("slider__button-container")[0].addEventListener('click', (e) => {
        if (e.target.classList.contains('slider__button')) {
            let buttonIndex = Array.prototype.indexOf.call(e.target.parentElement.children, e.target);

            clearInterval(sliderInterval);
            sliderInterval = undefined;
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
            setTimeout(() => {
                for (let el of e.target.parentElement.children) {
                    el.disabled = false;
                }
            }, slideDuration)

            glide(frameRow, -frameOffsets[framePosition], -frameOffsets[buttonIndex], slideDuration);
            framePosition = buttonIndex;
        }
    });

    return () => {
        if (frameCount > 1) {
            let sliderButtonContainer = document.getElementsByClassName("slider__button-container")[0];
            //если последний кадр - возвращаемся к первому
            if (framePosition === frameCount - 1) {
                glide(frameRow, -frameOffsets[framePosition], -frameOffsets[0], slideDuration);
                //перекрашиваем кнопку соответствующею кадру
                sliderButtonContainer.children[framePosition].classList.remove("slider__button__displayed");
                framePosition = 0;
                sliderButtonContainer.children[framePosition].classList.add("slider__button__displayed");
            }
            else {
                glide(frameRow, -frameOffsets[framePosition], -frameOffsets[framePosition + 1], slideDuration);

                sliderButtonContainer.children[framePosition].classList.remove("slider__button__displayed");
                framePosition++;
                sliderButtonContainer.children[framePosition].classList.add("slider__button__displayed");
            }
        }
    }
}

//защита от поломки слайдера при ресайзе (когда ширина кадра меняется нужно пересчитать 
//переменные функции nextFrameWrapper)
onresize = (() => {
    let clientInnerWidthPrevious = innerWidth;
    //на мобильных браузерах окно ресайзится при скролле (пропадает строка адреса)
    //поэтому тригеррим пересчет переменных nextFrameWrapper только когда произошел ресайз ширины
    return (e) => {
        console.log(e);
        if (typeof sliderInterval !== 'undefined' &&
            document.getElementsByClassName("slider__frame-row")[0] !== 'undefined') {
            if (innerWidth != clientInnerWidthPrevious) {
                clientInnerWidthPrevious = innerWidth;
                clearInterval(sliderInterval);
                sliderInterval = undefined;
                nextFrame = nextFrameWrapper();
                document.getElementsByClassName("slider__frame-row")[0].style.left = '0px';
                sliderInterval = setInterval(nextFrame, 5000);
                //раскрашиваем первую кнопку
                for (let el of document.getElementsByClassName("slider__button-container")[0].children) {
                    el.classList.remove('slider__button__displayed');
                }
                document.getElementsByClassName("slider__button-container")[0].children[0].classList.add('slider__button__displayed');
            }
        }
    }
})();

onblur = () => {
    //останавливаем показ слайдов при дефокусе окна чтобы не образовалось очереди коллбэков 
    //из-за setInterval (будет истеричное перематывание после возвращания к окну)
    if (typeof sliderInterval !== 'undefined') {
        clearInterval(sliderInterval);
        sliderInterval = undefined;
    }
}

onfocus = (e) => {
    if (typeof document.getElementsByClassName("slider")[0] !== 'undefined' &&
    sliderInterval === undefined) {
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
}

//запускаем слайдшоу
sliderInterval = setInterval(nextFrame, 5000);

//функция горизонтального скролла cases__panel в мобильной и планшетной версии
if (typeof document.getElementsByClassName("cases__panel")[0] !== 'undefined') {
    document.getElementsByClassName("cases__panel")[0].ontouchmove = (() => {
        if (screen.availWidth < 1440) {
            let casesPanel = document.getElementsByClassName("cases__panel")[0];
            let cXPrev = undefined; //x предыдущего ивента
            casesPanel.style.left = '0px';
            return (e) => {
                if (cXPrev === undefined) cXPrev = e.changedTouches[0].clientX;
                else {
                    //обнуляем cXPrev когда палец отлипает от экрана
                    if (e.type === 'touchend') {
                        cXPrev = undefined;
                        return;
                    }
                    //проверяем, чтобы левая граница cases__panel не уезжала правее левой границы wrapper'а, a правая левее правой
                    if ((parseInt(casesPanel.style.left) - cXPrev + e.changedTouches[0].clientX <= 0) &&
                        (casesPanel.getBoundingClientRect().right >
                            casesPanel.parentElement.getBoundingClientRect().right)) {
                        casesPanel.style.left =
                            `${parseInt(casesPanel.style.left) - cXPrev + e.changedTouches[0].clientX}px`;
                        cXPrev = e.changedTouches[0].clientX;
                    }
                    //избавляемся от застревания правой границы cases__panel появляющегося благодаря предыдущему if 
                    //когда граница совпадает с родительским элементом
                    if (casesPanel.getBoundingClientRect().right <=
                        casesPanel.parentElement.getBoundingClientRect().right &&
                        (cXPrev - e.changedTouches[0].clientX < 0)) {
                        casesPanel.style.left =
                            `${parseInt(casesPanel.style.left) - cXPrev + e.changedTouches[0].clientX}px`;
                        cXPrev = e.changedTouches[0].clientX;
                    }
                }

                //если резко дернуть блок влево, то правая граница все равно заезжает за правую границу wrapper'a
                //фиксим (если значение левее, то ровняем правые границы)
                if (casesPanel.getBoundingClientRect().right <
                    casesPanel.parentElement.getBoundingClientRect().right) {
                    casesPanel.style.left =
                        `-${casesPanel.getBoundingClientRect().width -
                        casesPanel.parentElement.getBoundingClientRect().width}px`;
                }

                //далее перекрашиваются круглишки под панелью в зависимости от того насколько проскроллено
                let maxOffsetLeft = casesPanel.getBoundingClientRect().width -
                    casesPanel.parentElement.getBoundingClientRect().width + 1;
                let offsetLeft = Math.abs(parseInt(casesPanel.style.left));
                let elemCount = casesPanel.children.length;

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
    typeof document.getElementsByClassName("header__mobile-navscreen")[0] !== 'undefined') {
    document.getElementsByClassName("header__burger")[0].children[0].onchange = (e) => {

        let mobileNavscreen = document.getElementsByClassName("header__mobile-navscreen")[0];

        if (mobileNavscreen.style.display != "block") {

            mobileNavscreen.style.display = "block";

            //ландшафтная мобильная менюшка будет со скроллом
            document.getElementsByClassName("header")[0].classList.add('header__opened');
            if (innerWidth < 600 && innerHeight < 600) {
                mobileNavscreen.style.height = `550px`;
                return;
            }
            if (innerWidth < innerHeight) {
                if (innerWidth > 768) {
                    mobileNavscreen.style.height = `${innerHeight - 81}px`;
                }
                else {
                    mobileNavscreen.style.height = `${innerHeight - 56}px`;
                }
            }
            else {
                if (innerWidth > 768) {
                    mobileNavscreen.style.height = `${innerWidth - 81}px`;
                }
                else {
                    mobileNavscreen.style.height = `${innerWidth - 56}px`;
                }
            }
        }
        else {
            mobileNavscreen.style.display = "";
            document.getElementsByClassName("header")[0].classList.remove('header__opened');
            mobileNavscreen.style.height = ``;
        }
    }
    document.getElementsByClassName("header__mobile-navscreen")[0].onclick = (e) => {
        document.getElementsByClassName("header__burger")[0].children[0].checked = false;
        document.getElementsByClassName("header__mobile-navscreen")[0].style.display = "none";
        document.getElementsByClassName("header")[0].classList.remove('header__opened');
        document.getElementsByClassName("header__mobile-navscreen")[0].style.height = '';
    }
}


//функции для форм
if (typeof document.getElementById('footer__form') !== 'undefined') {
    document.getElementById('footer__form').onsubmit = (e) => {
        e.preventDefault();

        if (isValidEmail(e.target[1].value)) {
            alert(`Form data:\nName: ${e.target[0].value}\nE-Mail: ${e.target[1].value}\nInfo: ${e.target[2].value}`);

            for (let el of e.target.children) {
                el.style.display = 'none';
            }
            document.getElementById('footer__form-p').style.display = 'block';

            e.target[1].style.border = '';
            e.target[1].oninput = null;
        }
        else {
            e.target[1].style.border = '1px solid red';
            e.target[1].oninput = (e) => {
                e.target.style.border = '';
            }

            return false;
        }
    }

    if (typeof document.forms !== 'undefined') {
        for (let f of document.forms) {
            if (f.id != 'footer__form') {
                f.onsubmit = (e) => {
                    e.preventDefault();

                    if (isValidEmail(e.target[0].value)) {
                        e.target[0].style.display = 'none';
                        e.target[1].style.display = 'none';
                        e.target.children[0].style.display = 'block';
                        e.target[0].style.color = '';
                        e.target[0].oninput = null;
                    }
                    else {
                        e.target[0].style.color = 'red';
                        e.target[0].oninput = (e) => { e.target.style.color = ''; }
                    }

                    return false;
                }
            }
        }
    }

    //украл из npm email-validator package
    function isValidEmail(email) {
        const tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

        if (!email)
            return false;

        if (email.length > 254)
            return false;

        let valid = tester.test(email);
        if (!valid)
            return false;

        let parts = email.split("@");
        if (parts[0].length > 64)
            return false;

        let domainParts = parts[1].split(".");
        if (domainParts.some((part) => { return part.length > 63; }))
            return false;

        return true;
    }

    document.getElementById('header__button').onclick = () => {
        scrollTo(0, document.body.scrollHeight);
    }
}