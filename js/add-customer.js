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
    const text = $option.find(".text").text() || $option.text();

    $dropdown.find(".customer-dropdown-trigger .value").text(text);
    $dropdown.find(".customer-dropdown-option").removeClass("active");
    $option.addClass("active");
    $dropdown.data("value", value);

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
    let isValid = true;

    $(".customer-input[required]").each(function () {
        if (!validateInput($(this))) isValid = false;
    });

    if (!isValid) {
        $(".customer-content").css("animation", "shake 0.5s ease-in-out");
        setTimeout(() => $(".customer-content").css("animation", ""), 500);
        return;
    }

    $btn.prop("disabled", true).html(
        '<i class="fas fa-spinner fa-spin"></i><span>در حال افزودن...</span>'
    );

    setTimeout(() => {
        console.log("Form submitted:", getFormData());
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
        countryCode:
            $('.customer-dropdown[data-dropdown="country-code"]').data(
                "value"
            ) || "+98",
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
    $("#addAddressToggle").prop("checked", false).trigger("change");
    $("#billingSameToggle").prop("checked", true);
}
