/* 동영상 다운로드 */
$(".form-box__download-submit").click((event) => {
    event.preventDefault();

    if ($(".form-box__download-file-name").val() == "") {
        alert("모자이크 처리된 동영상이 없습니다.")
        return;
    }

    /* 로딩창 추가 */
    $(".loading-bg").removeClass("none")
    $(".infinityChrome").removeClass("none")

    const data = $(".form-box__download-form").serialize()  // serializeArray -> https://stackoverflow.com/questions/8289349/jquery-appending-to-serialize 참조

    $(".form-box__download-submit").prop("disabled", true);
    const url = $(".form-box__download-form").attr("action");

    $.ajax({    // https://sub0709.tistory.com/62 참조
        url: url,
        data: data,
        type: "POST",
        cache: false,
        xhrFields: {
            responseType: 'blob'
        },
        success: function (response, status, xhr) {
            const blob = new Blob([response]);

            const disposition = xhr.getResponseHeader('Content-Disposition')
            let filename = ""

            if (disposition && disposition.indexOf('attachment') !== -1) {     // indexOf() 메서드는 호출한 String 객체에서 주어진 값과 일치하는 첫 번째 인덱스를 반환한다. disposition-type이 attachment인지 확인하는 듯하다.
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);  // exec() 메소드는 어떤 문자열에서 정규표현식과 일치하는 문자열 검색을 수행한다.
                if (matches != null && matches[1]) filename = decodeURI(matches[1].replace(/['"]/g, ''));  // Content-Disposition에 한글을 사용하면 오류가 발생하기 때문에 서버에서 인코딩된 문자열을 사용했으므로, decode 해줌.
            }

            // 파일 저장
            if (navigator.msSaveBlob) {
                return navigator.msSaveBlob(blob, url)
            } else {
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.target = "_blank"
                link.download = filename;   // 다운로드 파일명
                link.click();
            }
        },
        error: function (req, status, error) {
            alert("다운로드 실패!")
            console.log("req", req)
            console.log("status", status)
            console.log("error", error)
        },
        complete: function () {
            $(".form-box__download-submit").prop("disabled", false);
            /* 로딩창 추가 */
            $(".loading-bg").addClass("none")
            $(".infinityChrome").addClass("none")
        }
    })
})

/* 모자이크 Go! */
$(".form-box__mosaic-submit").click((event) => {
    event.preventDefault();

    const formData = []

    const checked = $("input:checkbox[name = 'option']:checked");   // 체크된 모자이크 대상 선택

    if (checked.length === 0) {   // 체크된 checkbox가 없다면
        alert("모자이크 대상을 선택해주세요!");
        return;
    }

    checked.each((index, elem) => {  // 체크된 각 checkbox를 list에 push, 각 객체에는 name 프로퍼티와 value 프로퍼티가 필요함
        formData.push({ name: `option${index}`, value: elem.id })
    })

    if ($(".form-box__upload_file_name").val() === "") {
        alert("모자이크 할 동영상을 업로드 해주세요!")
        return;
    }

    formData.push({ name: "filename", value: $(".form-box__upload_file_name")[0].value }) // 파일명 list에 추가

    /* 로딩창 추가 */
    $(".loading-bg").removeClass("none")
    $(".infinityChrome").removeClass("none")

    // submit 버튼 disable
    $(".form-box__mosaic-submit").prop("disabled", true);

    $.ajax({
        url: $(".form-box__checkbox-form").attr("action"),
        data: formData,
        type: "POST",
        cache: false,
        success: function (response) {
            if (response.error === true) {    // 서버에서 error를 응답한 경우
                alert("모자이크 실패!")
            } else {
                //alert("모자이크 성공!")
                console.log(response.filePath)
                $(".content-container__user-video")[0].src = response.filePath
                $(".form-box__download-file-name")[0].value = response.fileName
            }
        },
        error: function (req, status, error) {
            alert("모자이크 실패!")
            console.log("req", req)
            console.log("status", status)
            console.log("error", error)
        },
        complete: function () {
            $(".form-box__mosaic-submit").prop("disabled", false);
            /* 로딩창 삭제 */
            $(".loading-bg").addClass("none")
            $(".infinityChrome").addClass("none")
        }
    })
})

function validFileType(file) {
    const validFileFomat = ["video/mp4", "video/WebM", "video/Ogg"]
    const isValid = (validFileFomat.indexOf(file.type) > -1)

    return isValid
}

/* 동영상 업로드 */
// Uncaught TypeError: Illegal invocation : query ajax 를 이용하여 data를 넘길때, 제대로 된 값이 아니거나 유형이 다를경우 발생.
$(".dropzone-wrapper__input")[0].addEventListener("change", upload) // drag & drop을 사용하여 업로드

$(document).bind('dragover', function (e) {
    var dropZone = $(".content-container"),
        timeout = window.dropZoneTimeout;
    if (timeout) {
        clearTimeout(timeout);
    }
    var found = false,
        node = e.target;
    do {
        if (node === dropZone[0]) {
            found = true;
            break;
        }
        node = node.parentNode;
    } while (node != null);
    
    if (found) {
        $(".dropzone-wrapper__input").css("display", "block");
        $(".drag-bg").removeClass("none")  
        //dropZone.addClass('hover');
    } 

    window.dropZoneTimeout = setTimeout(function () {
        window.dropZoneTimeout = null;
        $(".dropzone-wrapper__input").css("display", "none");
        $(".drag-bg").addClass("none")  
    }, 100);
});


function upload(event){
    const target = event.target; 
    const file = target.files[0];

    if (file === undefined) { return; } // 동영상을 선택하지 않은 경우

    if (!validFileType(file)) {   // 파일의 포맷을 확인하여, 지원하지 않는 포맷인 경우는 업로드 하지 않음
        alert('지원하지 않는 동영상 포맷입니다. 현재 지원하고 있는 동영상 포맷은 "video/mp4", "video/WebM", "video/Ogg" 입니다');
        target.value = ""    // 선택한 파일 초기화
        return;
    }

    const form = target.parentElement // element select
    const formData = new FormData(form);    // formData object 생성

    const url = form.action;

    /* 로딩창 추가 */
    $(".loading-bg").removeClass("none")
    $(".infinityChrome").removeClass("none")

    // https://enai.tistory.com/37, https://loco-motive.tistory.com/53, https://wondongho.tistory.com/m/96, https://cofs.tistory.com/181, http://magic.wickedmiso.com/9 참조 
    $.ajax({
        type: "POST",
        enctype: "multipart/form-data",    // multipart는 폼 데이터가 여러 부분으로 나뉘어 서버로 전송되는 것을 의미함 (https://velog.io/@runningwater/TIL-form-%EC%A0%84%EC%86%A1-%EC%8B%9C-enctype-%ED%99%95%EC%9D%B8%ED%95%98%EA%B8%B0 참조)
        url: url,
        data: formData,
        processData: false,    // 기본 값은 true이며, true일때는 data 값들이 쿼리스트링 형태인 key1=value1&key2=value2 형태로 전달된다. 하지만 이렇게 하면 file 값들은 제대로 전달되지 못하므로,  해당 값을 false로 해주어 { key1 : 'value1', key2 : 'value2' } 형태로 전달해 주어야 file 값들이 제대로 전달된다.
        contentType: false,    // 기본값은 'application/x-www-form-urlencoded'이다. 해당 기본 타입으로는 파일이 전송 안되기 때문에 false로 해주어야 한다.
        cache: false,
        timeout: 600000,
        success: function (response) {
            //alert("동영상 업로드 성공! ")
            if (response.error === true) {    // 서버에서 error를 응답한 경우
                alert("동영상 업로드 실패! 업로드 할 동영상을 다시 선택해주세요.2")
            } else {
                $(".content-container__user-video")[0].src = response.filePath
                $(".content-container__user-video").removeClass("none") // 초기 업로드 시 동영상의 none 속성을 없앰
                const player = new Plyr('#player');

                $(".content-container__user-video")[0].id = "player"
                $(".form-box__upload_file_name")[0].value = response.filePath.split("/").slice(-1)[0]   // 파일명만 저장
                $(".form-box__download-file-name").val("")  // 업로드 성공 시 다운로드 파일 path를 지움
            }
        },
        error: function (req, status, error) {
            alert("동영상 업로드 실패! 업로드 할 동영상을 다시 선택해주세요.1")
            console.log("req", req)
            console.log("status", status)
            console.log("error", error)
        },
        complete: function () {
            target.value = "" // 선택한 파일을 지워서, 같은 이름의 파일을 선택하더라도 change 이벤트가 발생하도록 함

            /* 로딩창 삭제 */
            $(".loading-bg").addClass("none")  // TODO: 로딩창이 사라지기 전에 alert가 먼저 표시되는 문제 해결
            $(".infinityChrome").addClass("none")
        }
    })
}

$(function () {
    /* 햄버거 메뉴 동작 */
    $('#menu').click(function () {
        $('#menu>span').toggleClass('on')
    })
})