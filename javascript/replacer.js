function submit_replacer() {
    var arguments_ = Array.from(arguments);
    galleryId = arguments_.pop();
    buttonsId = arguments_.pop();
    extraShowButtonsId = arguments_.pop();
    showSubmitButtons(buttonsId, false);

    var id = randomId();

    requestProgress(id, 
        gradioApp().getElementById(galleryId + "_gallery_container"),
        gradioApp().getElementById(galleryId + "_gallery"),
        function() {
            showSubmitButtons(buttonsId, true);
            showSubmitButtons(extraShowButtonsId, true);
        }
        );

    var res = create_submit_args(arguments_);

    res[0] = id;

    console.log(res);
    return res;
}



titles = {
    ...titles,
    "Max resolution on detection": "If one side of the image is smaller than that, it will be resized before detection. It doesn't have effect on inpainting. Reduces vram usage and mask generation time.",
    "Mask Expand": "Mask dilation, px, releative to \"Max resolution on detection\"",
    "Extra mask expand": "Extra mask dilation on hires fix step, px, releative to \"Max resolution on detection\"",
    "Limit avoidance mask canvas resolution on creating": "Limit the canvas created by the buttom, using \"Max resolution on detection\" option",
    "Limit custom mask canvas resolution on creating": "Limit the canvas created by the buttom, using \"Max resolution on detection\" option",
};


let replacer_gallery = undefined;
onAfterUiUpdate(function() {
    if (!replacer_gallery) {
        replacer_gallery = attachGalleryListeners("replacer");
    }
});


function replacerGetCurrentSourceImg(dummy_component, isAvoid, needLimit, maxResolutionOnDetection) {
        const img = gradioApp().querySelector('#replacer_image div div img');
        var maskId = '';
        if (isAvoid){
            maskId = 'replacer_avoidance_mask';
        } else {
            maskId = 'replacer_custom_mask';
        }
        const removeButton = gradioApp().getElementById(maskId).querySelector('button[aria-label="Remove Image"]');
        if (removeButton){
            removeButton.click();
        }
        let resImg = img ? img.src : null;
        return [resImg, isAvoid, needLimit, maxResolutionOnDetection];
    }



async function replacer_waitForOpts() {
    for (; ;) {
        if (window.opts && Object.keys(window.opts).length) {
            return window.opts;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

var isZoomAndPanIntegrationApplied = false;

function replacerApplyZoomAndPanIntegration () {
    if (typeof window.applyZoomAndPanIntegration === "function") {
        window.applyZoomAndPanIntegration("#replacer_advanced_options", ["#replacer_avoidance_mask", "#replacer_custom_mask"]);
        isZoomAndPanIntegrationApplied = true;
    }
}

function replacerApplyZoomAndPanIntegration_withMod () {
    if (typeof window.applyZoomAndPanIntegration === "function" && typeof window.applyZoomAndPanIntegration_replacer_mod === "function") {
        window.applyZoomAndPanIntegration_replacer_mod("#replacer_advanced_options", ["#replacer_avoidance_mask", "#replacer_custom_mask"]);
        isZoomAndPanIntegrationApplied = true;
    }
}

onUiUpdate(async() => {
    if (isZoomAndPanIntegrationApplied) return;
    const opts = await replacer_waitForOpts();

    if (opts.prioritized_callbacks_app_started) { // webui 1.9
        replacerApplyZoomAndPanIntegration();
    } else {
        replacerApplyZoomAndPanIntegration_withMod();
    }
});


function replacerRemoveInpaintDiffMaskUpload() {
    const mask = gradioApp().getElementById('replacer_inpaint_diff_mask_view');
    if (!mask){ return; }
    var imageContainer = mask.getElementsByClassName('image-container')[0];
    if (!imageContainer){ return; }
    const images = imageContainer.getElementsByTagName('img');

    if (images.length == 0){
        imageContainer.style.visibility='hidden';
    } else {
        imageContainer.style.visibility='visible';
    }
}

onUiUpdate(replacerRemoveInpaintDiffMaskUpload);


onUiLoaded(function() {
    let replacer_generate = gradioApp().getElementById('replacer_generate');
    let replacer_hf_generate = gradioApp().getElementById('replacer_hf_generate');
    replacer_generate.title = '';
    replacer_hf_generate.title = '';
});



function replacer_imageComparisonloadImage() {
    let source_a = gradioApp().getElementById('replacer_image').querySelector('img');
    let source_b = gradioApp().getElementById('replacer_gallery').querySelector('img');

    if (source_a == null || source_b == null)
    return;

    ImageComparator.img_A.src = source_a.src;
    ImageComparator.img_B.src = source_b.src;
    ImageComparator.reset();
}

function replacer_imageComparisonAddButton() { // https://github.com/Haoming02/sd-webui-image-comparison
    // 0: Off ; 1: Text ; 2: Icon
    const config = gradioApp().getElementById('setting_comp_send_btn')?.querySelectorAll('label');
    if (!config) return;
    var option = 0;

    for (let i = 1; i < 3; i++) {
        if (config[i].classList.contains('selected')) {
            option = i;
            break;
        }
    }

    if (option === 0)
        return;

    ['replacer'].forEach((mode) => {
        const row = gradioApp().getElementById(`image_buttons_${mode}`).querySelector('.form');
        const btn = row.lastElementChild.cloneNode();

        btn.id = `${mode}_send_to_comp`;
        btn.title = "Send images to comparison tab.";
        if (option === 1)
            btn.textContent = "Send to Comparison";
        else
            btn.textContent = "🆚";

        btn.addEventListener('click', () => {
            replacer_imageComparisonloadImage();
            ImageComparator.switch_to_comparison();
        }); 

        row.appendChild(btn);
    });
}

onUiLoaded(async () => {
    replacer_imageComparisonAddButton();
});
