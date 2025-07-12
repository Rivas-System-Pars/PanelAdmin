// Import jQuery and Bootstrap
// const $ = window.jQuery
// const bootstrap = window.bootstrap

// Custom Dropdown System
class OrderCustomDropdown {
    constructor(element) {
        this.dropdown = $(element);
        this.trigger = this.dropdown.find(".order-dropdown-trigger");
        this.menu = this.dropdown.find(".order-dropdown-menu");
        this.text = this.dropdown.find(".order-dropdown-text");
        this.items = this.dropdown.find(".order-dropdown-item");
        this.isOpen = false;
        this.selectedValue = "";
        this.selectedText = this.text.text();

        this.init();
    }

    init() {
        // Toggle dropdown
        this.trigger.on("click", (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Select item
        this.items.on("click", (e) => {
            const item = $(e.currentTarget);
            const value = item.data("value");
            const text = item.text().trim();

            this.select(value, text);
            this.close();
        });

        // Close on outside click
        $(document).on("click", (e) => {
            if (!this.dropdown[0].contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.dropdown.hasClass("order-disabled")) return;

        // Close other dropdowns
        $(".order-custom-dropdown.order-active").each((i, el) => {
            if (el !== this.dropdown[0]) {
                $(el)
                    .removeClass("order-active")
                    .find(".order-dropdown-menu")
                    .removeClass("order-show");
            }
        });

        this.dropdown.addClass("order-active");
        this.menu.addClass("order-show");
        this.isOpen = true;
    }

    close() {
        this.dropdown.removeClass("order-active");
        this.menu.removeClass("order-show");
        this.isOpen = false;
    }

    select(value, text) {
        this.selectedValue = value;
        this.selectedText = text;
        this.text.text(text);

        // Update active state
        this.items.removeClass("order-active");
        this.items.filter(`[data-value="${value}"]`).addClass("order-active");

        // Trigger change event
        this.dropdown.trigger("change", [value, text]);
    }

    getValue() {
        return this.selectedValue;
    }

    setText(text) {
        this.text.text(text);
        this.selectedText = text;
    }

    disable() {
        this.dropdown.addClass("order-disabled");
        this.close();
        this.reset();
        $(".create_order_modal").addClass("justify-content-start");
        $(".create_order_modal-dialog").addClass("mt-3");
    }

    enable() {
        this.dropdown.removeClass("order-disabled");
        setTimeout(() => {
            $(".create_order_modal").removeClass("justify-content-start");
            $(".create_order_modal-dialog").removeClass("mt-3");
        }, 350);
    }

    reset() {
        const firstItem = this.items.first();
        const value = firstItem.data("value");
        const text = firstItem.text().trim();
        this.select(value, text);
    }
}

// Form validation
class OrderFormValidator {
    constructor() {
        this.rules = {};
    }

    addRule(fieldId, validator, message) {
        this.rules[fieldId] = { validator, message };
    }

    validate(fieldId, value) {
        const rule = this.rules[fieldId];
        if (!rule) return { valid: true };

        const isValid = rule.validator(value);
        return {
            valid: isValid,
            message: isValid ? "" : rule.message,
        };
    }

    validateAll(formData) {
        const errors = [];

        Object.keys(this.rules).forEach((fieldId) => {
            const value = formData[fieldId] || "";
            const result = this.validate(fieldId, value);

            if (!result.valid) {
                errors.push({
                    field: fieldId,
                    message: result.message,
                });

                // Add error styling to dropdown or input
                const element = $(`[data-dropdown="${fieldId}"]`);
                if (element.length) {
                    element
                        .find(".order-dropdown-trigger")
                        .addClass("order-error");
                    setTimeout(() => {
                        element
                            .find(".order-dropdown-trigger")
                            .removeClass("order-error");
                    }, 3000);
                } else {
                    $(`#${fieldId}`).addClass("order-error");
                    setTimeout(() => {
                        $(`#${fieldId}`).removeClass("order-error");
                    }, 3000);
                }
            }
        });

        return errors;
    }
}

// Initialize systems
const validator = new OrderFormValidator();

// Initialize all dropdowns
const dropdowns = {};
$(".order-custom-dropdown").each(function () {
    const dropdownName = $(this).data("dropdown");
    dropdowns[dropdownName] = new OrderCustomDropdown(this);
});

// Add validation rules with Persian messages
validator.addRule(
    "customerSelect",
    (value) => {
        const isNewCustomer = $("#newCustomerToggle").is(":checked");
        return isNewCustomer || value !== "";
    },
    "لطفاً یک مشتری انتخاب کنید یا حالت مشتری جدید را فعال کنید"
);

validator.addRule(
    "paymentType",
    (value) => value !== "",
    "لطفاً نوع پرداخت را انتخاب کنید"
);
validator.addRule(
    "orderType",
    (value) => value !== "",
    "لطفاً نوع سفارش را انتخاب کنید"
);

// Add validation rules for new customer fields
validator.addRule(
    "customerName",
    (value) => {
        const isNewCustomer = $("#newCustomerToggle").is(":checked");
        return !isNewCustomer || (value && value.trim().length >= 2);
    },
    "لطفاً نام مشتری را وارد کنید"
);

validator.addRule(
    "customerEmail",
    (value) => {
        const isNewCustomer = $("#newCustomerToggle").is(":checked");
        if (!isNewCustomer) return true;

        if (!value) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    "لطفاً ایمیل معتبر وارد کنید"
);

validator.addRule(
    "customerPhone",
    (value) => {
        const isNewCustomer = $("#newCustomerToggle").is(":checked");
        if (!isNewCustomer) return true;

        return value && value.trim().length >= 7;
    },
    "لطفاً شماره تلفن را وارد کنید"
);

// Bootstrap Modal Events
const modal = new bootstrap.Modal("#createOrderModal");

$(".create_order_button").on("click", () => {
    modal.show();
});

// Modal event listeners
$("#createOrderModal").on("shown.bs.modal", () => {
    // Focus first dropdown when modal opens
    if (dropdowns.customerSelect) {
        dropdowns.customerSelect.trigger.focus();
    }
});

$("#createOrderModal").on("hidden.bs.modal", () => {
    resetForm();
});

// New customer toggle - UPDATED VERSION
$("#newCustomerToggle").on("change", function () {
    const isChecked = $(this).is(":checked");
    const newCustomerFields = $("#newCustomerFields");

    if (isChecked) {
        // Show new customer fields
        newCustomerFields.slideDown(300);
        if (dropdowns.customerSelect) {
            dropdowns.customerSelect.disable();
        }

        // Focus on first field after animation
        setTimeout(() => {
            $("#customerName").focus();
        }, 350);

        if (typeof window.showNotification === "function") {
            window.showNotification("حالت مشتری جدید فعال شد", "info");
        }
    } else {
        // Hide new customer fields
        newCustomerFields.slideUp(300);
        if (dropdowns.customerSelect) {
            dropdowns.customerSelect.enable();
        }

        // Clear the fields
        $("#customerName, #customerEmail, #customerPhone").val("");

        if (typeof window.showNotification === "function") {
            window.showNotification("حالت مشتری موجود فعال شد", "info");
        }
    }
});


// Product search with debounce
let searchTimeout;
$("#productSearch").on("input", function () {
    const searchTerm = $(this).val();

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (searchTerm.length > 2) {
            if (typeof window.showNotification === "function") {
                window.showNotification(`جستجو برای: ${searchTerm}`, "info", {
                    duration: 2000,
                });
            }
            console.log("Searching for products:", searchTerm);
        }
    }, 500);
});

// Phone number formatting
$("#customerPhone").on("input", function () {
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

// Form submission - UPDATED VERSION
$("#createOrderBtn").on("click", function () {
  const button = $(this);
    button.addClass("order-loading");

    // Collect form data including new customer fields
    const formData = {
        customerSelect: dropdowns.customerSelect
            ? dropdowns.customerSelect.getValue()
            : "",
        paymentType: dropdowns.paymentType
            ? dropdowns.paymentType.getValue()
            : "",
        orderType: dropdowns.orderType ? dropdowns.orderType.getValue() : "",
        orderStatus: dropdowns.orderStatus
            ? dropdowns.orderStatus.getValue()
            : "",
        orderDate: $("#orderDate").val(),
        orderTime: $("#orderTime").val(),
        orderNote: $("#orderNote").val(),
        // FIXED: Use :checked to get toggle state
        newCustomer: $("#newCustomerToggle").is(":checked"),
        // New customer fields
        customerName: $("#customerName").val(),
        customerEmail: $("#customerEmail").val(),
        customerPhone: $("#customerPhone").val(),
        countryCode: dropdowns.countryCode
            ? dropdowns.countryCode.getValue()
            : "+98",
    };
      // Validate form
    const errors = validator.validateAll(formData);

    setTimeout(() => {
        button.removeClass("order-loading");

        if (errors.length > 0) {
            errors.forEach((error) => {
                if (typeof window.showNotification === "function") {
                    window.showNotification(error.message, "error");
                }
            });
            return;
        }

        // Success
        if (typeof window.showNotification === "function") {
            window.showNotification("سفارش با موفقیت ایجاد شد!", "success");
        }
        console.log("Order Data:", formData);

        // Close modal and reset form
        setTimeout(() => {
            modal.hide();
        }, 1500);
    }, 1000);
});

// Reset form function - UPDATED VERSION
function resetForm() {
    if (dropdowns.customerSelect) dropdowns.customerSelect.reset();
    if (dropdowns.paymentType) dropdowns.paymentType.reset();
    if (dropdowns.orderType) dropdowns.orderType.reset();
    if (dropdowns.orderStatus)
        dropdowns.orderStatus.select("pending", "در انتظار");
    if (dropdowns.countryCode) dropdowns.countryCode.select("+234", "+234");

    $("#orderNote").val("");
    $("#productSearch").val("");
    $("#customerName, #customerEmail, #customerPhone").val("");
    $("#newCustomerToggle").prop("checked", false);
    $("#newCustomerFields").hide();

    if (dropdowns.customerSelect) {
        dropdowns.customerSelect.enable();
    }

    // Remove any error states
    $(".order-error").removeClass("order-error");
}

// Keyboard shortcuts
$(document).on("keydown", (e) => {
    if (e.key === "Escape") {
        // Close any open dropdowns first
        $(".order-custom-dropdown.order-active").each(function () {
            const dropdownName = $(this).data("dropdown");
            if (dropdowns[dropdownName]) {
                dropdowns[dropdownName].close();
            }
        });
    }
});

// Auto-save draft - UPDATED VERSION
let draftTimeout;
$("input, textarea").on("input change", () => {
    clearTimeout(draftTimeout);
    draftTimeout = setTimeout(() => {
        const formData = {
            customerSelect: dropdowns.customerSelect
                ? dropdowns.customerSelect.getValue()
                : "",
            paymentType: dropdowns.paymentType
                ? dropdowns.paymentType.getValue()
                : "",
            orderType: dropdowns.orderType
                ? dropdowns.orderType.getValue()
                : "",
            orderNote: $("#orderNote").val(),
            customerName: $("#customerName").val(),
            customerEmail: $("#customerEmail").val(),
            customerPhone: $("#customerPhone").val(),
            newCustomer: $("#newCustomerToggle").is(":checked"),
        };

        localStorage.setItem("orderDraft", JSON.stringify(formData));
    }, 1000);
});

// Load draft on page load - UPDATED VERSION
const savedDraft = localStorage.getItem("orderDraft");
if (savedDraft) {
    try {
        const draft = JSON.parse(savedDraft);

        // Set dropdown values
        Object.keys(draft).forEach((key) => {
            if (draft[key] && dropdowns[key]) {
                const item = $(
                    `[data-dropdown="${key}"] .order-dropdown-item[data-value="${draft[key]}"]`
                );
                if (item.length) {
                    dropdowns[key].select(draft[key], item.text().trim());
                }
            } else if (draft[key] && $(`#${key}`).length) {
                $(`#${key}`).val(draft[key]);
            }
        });

        // Handle new customer toggle
        if (draft.newCustomer) {
            $("#newCustomerToggle").prop("checked", false).trigger("change");
        }
    } catch (e) {
        console.log("Error loading draft:", e);
    }
}

// Placeholder for showNotification function if it doesn't exist
if (typeof window.showNotification === "undefined") {
    window.showNotification = (message, type, options) => {
        console.log(`${type.toUpperCase()}: ${message}`);
        // You can replace this with your actual notification system
    };
}
