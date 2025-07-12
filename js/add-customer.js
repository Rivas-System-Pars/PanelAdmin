let isModalVisible = false;
let activeDropdown = null;

// Persian numbers
const persianNums = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const englishNums = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const toPersian = (str) =>
    persianNums.reduce(
        (acc, p, i) => acc.replace(new RegExp(englishNums[i], "g"), p),
        str
    );
const toEnglish = (str) =>
    englishNums.reduce(
        (acc, e, i) => acc.replace(new RegExp(persianNums[i], "g"), e),
        str
    );

init();

function init() {
    setupEvents();
    setupDropdowns();
    setupToggles();
    setupValidation();
    convertNumbers();
    setDefaultCountryCode(); // Add this line
}
function setDefaultCountryCode() {
    const $countryDropdown = $(
        '.customer-dropdown[data-dropdown="country-code"]'
    );
    if ($countryDropdown.length) {
        $countryDropdown.data("value", "+98");
        $countryDropdown
            .find(".customer-dropdown-value")
            .text("ایران (+98)")
            .addClass("selected");
        $countryDropdown
            .find(".customer-dropdown-option[data-value='+98']")
            .addClass("active");
        $countryDropdown
            .find(".customer-dropdown-trigger")
            .prop("disabled", true);
    }
}
function setupEvents() {
    $("#customerToggle").on("click", toggleModal);
    $("#closeCustomer, #cancelCustomer").on("click", hideModal);
    $(".customer-backdrop").on("click", hideModal);
    $(".customer-content").on("click", (e) => e.stopPropagation());
    $("#customerForm").on("submit", (e) => {
        e.preventDefault();
        submitForm();
    });

    $(document).on("keydown", (e) => {
        if (!isModalVisible) return;
        if (e.key === "Escape") hideModal();
    });
}

function setupDropdowns() {
    $(".customer-dropdown").each(function () {
        const $dropdown = $(this);
        if ($dropdown.data("dropdown") === "country-code") return; // Skip country code

        const $trigger = $dropdown.find(".customer-dropdown-trigger");
        const $menu = $dropdown.find(".customer-dropdown-menu");

        $trigger.on("click", () => toggleDropdown($dropdown));
        $dropdown.find(".customer-dropdown-option").on("click", function () {
            selectOption($dropdown, $(this));
        });
    });

    $(document).on("click", (e) => {
        if (
            activeDropdown &&
            !$(e.target).closest(".customer-dropdown").length
        ) {
            closeDropdown(activeDropdown);
        }
    });
}

function setupToggles() {
    $("#addAddressToggle").on("change", function () {
        $("#addressFields").toggleClass("hidden", !$(this).is(":checked"));
    });

    // Initialize address fields as hidden
    $("#addressFields").addClass("hidden");
}

function setupValidation() {
    $(".customer-input").on("input blur", function () {
        validateInput($(this));
    });

    // Persian name validation
    $('[data-input="customer-name"]').on("input", function () {
        let value = $(this).val();
        // Allow only Persian letters and spaces
        value = value.replace(/[^\u0600-\u06FF\s]/g, "");
        $(this).val(value);
        validateInput($(this));
    });

    // Iranian mobile number validation
    $('[data-input="phone-number"]').on("input", function () {
        let value = toEnglish($(this).val()).replace(/\D/g, "");
        // Format Iranian mobile number
        if (value.length > 0 && !value.startsWith("9")) {
            if (value.startsWith("0")) {
                value = value.substring(1);
            }
        }
        $(this).val(value);
        validateInput($(this));
    });
}

function convertNumbers() {
    $(".dropdown-option .text, .dropdown-trigger .value").each(function () {
        $(this).text(toPersian($(this).text()));
    });
}

function toggleModal() {
    isModalVisible ? hideModal() : showModal();
}

function showModal() {
    const $modal = $("#customerModal");
    const $btn = $("#customerToggle");

    $modal.removeClass("hide").addClass("show").show();
    $btn.addClass("active").find(".btn-text").text("بستن فرم");
    $btn.find("i").removeClass("fa-user-plus").addClass("fa-times");

    isModalVisible = true;
    $("body").css("overflow", "hidden");

    setTimeout(() => $('[data-input="customer-name"]').focus(), 300);
}

function hideModal() {
    const $modal = $("#customerModal");
    const $btn = $("#customerToggle");

    $modal.removeClass("show").addClass("hide");
    $btn.removeClass("active").find(".btn-text").text("افزودن مشتری جدید");
    $btn.find("i").removeClass("fa-times").addClass("fa-user-plus");

    if (activeDropdown) closeDropdown(activeDropdown);

    setTimeout(() => {
        $modal.hide();
        isModalVisible = false;
    }, 300);

    $("body").css("overflow", "");
}

function toggleDropdown($dropdown) {
    if (activeDropdown && activeDropdown[0] !== $dropdown[0]) {
        closeDropdown(activeDropdown);
    }

    const $trigger = $dropdown.find(".customer-dropdown-trigger");
    const $menu = $dropdown.find(".customer-dropdown-menu");

    if ($trigger.hasClass("active")) {
        closeDropdown($dropdown);
    } else {
        $trigger.addClass("active");
        $menu.addClass("show").show();
        activeDropdown = $dropdown;
    }
}

function closeDropdown($dropdown) {
    $dropdown.find(".customer-dropdown-trigger").removeClass("active");
    $dropdown.find(".customer-dropdown-menu").removeClass("show").hide();
    activeDropdown = null;
}

function selectOption($dropdown, $option) {
    const value = $option.data("value");
    const text = $option.text();
    const $valueSpan = $dropdown.find(".customer-dropdown-value");

    // Update display
    $valueSpan.text(text).addClass("selected");

    // Update dropdown state
    $dropdown.find(".customer-dropdown-option").removeClass("active");
    $option.addClass("active");
    $dropdown.data("value", value);

    // Remove error state if present
    $dropdown.find(".customer-dropdown-trigger").removeClass("invalid");

    closeDropdown($dropdown);
}

function validateInput($input) {
    const value = $input.val().trim();
    const isRequired = $input.prop("required");
    const inputType = $input.attr("data-input");

    $input.removeClass("valid invalid");

    if (isRequired && !value) {
        $input.addClass("invalid");
        return false;
    }

    if (value) {
        if (inputType === "customer-email") {
            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            $input.addClass(isValidEmail ? "valid" : "invalid");
            return isValidEmail;
        } else if (inputType === "phone-number") {
            const isValidPhone = /^9\d{9}$/.test(value);
            $input.addClass(isValidPhone ? "valid" : "invalid");
            return isValidPhone;
        } else if (inputType === "customer-name") {
            const isValidName = /^[\u0600-\u06FF\s]+$/.test(value);
            $input.addClass(isValidName ? "valid" : "invalid");
            return isValidName;
        } else {
            $input.addClass("valid");
        }
    }

    return true;
}

function submitForm() {
    const $btn = $("#submitCustomer");
    let hasErrors = false;
    const errors = [];

    // Clear previous error states
    $(".customer-input").removeClass("invalid");
    $(".customer-dropdown-trigger").removeClass("invalid");

    // Validate customer name
    const $customerName = $('[data-input="customer-name"]');
    const customerNameValue = $customerName.val().trim();
    if (!customerNameValue) {
        errors.push("لطفاً نام مشتری را وارد کنید");
        $customerName.addClass("invalid");
        hasErrors = true;
    } else if (customerNameValue.length < 2) {
        errors.push("نام مشتری باید حداقل ۲ کاراکتر باشد");
        $customerName.addClass("invalid");
        hasErrors = true;
    } else if (!/^[\u0600-\u06FF\s]+$/.test(customerNameValue)) {
        errors.push("لطفاً نام را به فارسی وارد کنید");
        $customerName.addClass("invalid");
        hasErrors = true;
    }

    // Validate phone number
    const $phoneNumber = $('[data-input="phone-number"]');
    const phoneValue = $phoneNumber.val().trim();
    if (!phoneValue) {
        errors.push("لطفاً شماره موبایل را وارد کنید");
        $phoneNumber.addClass("invalid");
        hasErrors = true;
    } else if (!/^9\d{9}$/.test(phoneValue)) {
        errors.push("شماره موبایل باید با ۹ شروع شده و ۱۰ رقم باشد");
        $phoneNumber.addClass("invalid");
        hasErrors = true;
    }

    // Validate email (if provided)
    const $customerEmail = $('[data-input="customer-email"]');
    const emailValue = $customerEmail.val().trim();
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        errors.push("لطفاً ایمیل معتبر وارد کنید");
        $customerEmail.addClass("invalid");
        hasErrors = true;
    }

    // Validate country code dropdown
    const $countryDropdown = $(
        '.customer-dropdown[data-dropdown="country-code"]'
    );
    // const countryValue = $countryDropdown.data("value");
    // if (!countryValue) {
    //     errors.push("لطفاً کد کشور را انتخاب کنید");
    //     $countryDropdown.find(".customer-dropdown-trigger").addClass("invalid");
    //     hasErrors = true;
    // }

    // Validate address fields if address toggle is checked
    if ($("#addAddressToggle").is(":checked")) {
        const $streetAddress = $('[data-input="street-address"]');
        const streetValue = $streetAddress.val().trim();
        if (!streetValue) {
            errors.push("لطفاً آدرس خیابان را وارد کنید");
            $streetAddress.addClass("invalid");
            hasErrors = true;
        } else if (streetValue.length < 5) {
            errors.push("آدرس خیابان باید حداقل ۵ کاراکتر باشد");
            $streetAddress.addClass("invalid");
            hasErrors = true;
        }

        const $city = $('[data-input="city"]');
        const cityValue = $city.val().trim();
        if (!cityValue) {
            errors.push("لطفاً نام شهر را وارد کنید");
            $city.addClass("invalid");
            hasErrors = true;
        }

        const $stateDropdown = $('.customer-dropdown[data-dropdown="state"]');
        const stateValue = $stateDropdown.data("value");
        if (!stateValue) {
            errors.push("لطفاً استان را انتخاب کنید");
            $stateDropdown
                .find(".customer-dropdown-trigger")
                .addClass("invalid");
            hasErrors = true;
        }
    }

    // If there are errors, show notifications and prevent submission
    if (hasErrors) {
        // Show shake animation

        // Show error notifications
        errors.forEach((error, index) => {
            setTimeout(() => {
                if (typeof window.showNotification === "function") {
                    window.showNotification(error, "error");
                } else {
                    console.error("Validation Error:", error);
                    alert(error); // Fallback
                }
            }, index * 300);
        });

        // Show summary notification
        setTimeout(() => {
            const summaryMessage = `لطفاً ${errors.length} خطای فرم را برطرف کنید`;
            if (typeof window.showNotification === "function") {
                window.showNotification(summaryMessage, "error");
            } else {
                console.error("Validation Error:", summaryMessage);
                alert(summaryMessage); // Fallback
            }
        }, errors.length * 300);

        return; // Stop form submission
    }

    // If validation passes, show success and proceed
    if (typeof window.showNotification === "function") {
        window.showNotification("اطلاعات فرم معتبر است، در حال ثبت...", "info");
    } else {
        console.log("اطلاعات فرم معتبر است، در حال ثبت...");
    }

    // Proceed with form submission
    $btn.prop("disabled", true).html(
        '<i class="fas fa-spinner fa-spin"></i><span>در حال افزودن...</span>'
    );

    setTimeout(() => {
        console.log("Form submitted:", getFormData());

        // Show success notification
        if (typeof window.showNotification === "function") {
            window.showNotification("مشتری با موفقیت اضافه شد!", "success");
        } else {
            console.log("مشتری با موفقیت اضافه شد!");
        }

        $btn.html('<i class="fas fa-check"></i><span>افزوده شد!</span>');

        setTimeout(() => {
            $btn.prop("disabled", false).html(
                '<i class="fas fa-plus"></i><span>افزودن</span>'
            );
            hideModal();
            resetForm();
        }, 1500);
    }, 1000);
}

function getFormData() {
    return {
        customerName: $('[data-input="customer-name"]').val(),
        customerEmail: $('[data-input="customer-email"]').val(),
        phoneNumber: toEnglish($('[data-input="phone-number"]').val()),
        countryCode: "+98",
        addAddress: $("#addAddressToggle").is(":checked"),
        streetAddress: $('[data-input="street-address"]').val(),
        city: $('[data-input="city"]').val(),
        state: $('.customer-dropdown[data-dropdown="state"]').data("value"),
        billingSame: $("#billingSameToggle").is(":checked"),
    };
}

function resetForm() {
    $("#customerForm")[0].reset();
    $(".customer-input").removeClass("valid invalid");
    $(".customer-dropdown").removeData("value");
    $(".customer-dropdown-trigger").removeClass("invalid");
    $("#addAddressToggle").prop("checked", false).trigger("change");
    $("#billingSameToggle").prop("checked", true);
    setDefaultCountryCode()
}
