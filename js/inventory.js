$(document).ready(() => {
    let currentAdditionalTarget = null;
    let productData = {};
    const additionalMedia = [];

    // Initialize form
    initializeForm();

    function initializeForm() {
        // Set initial states - show upload zone initially
        $("#uploadZone").show();
        $("#imageContainer").hide();
        $(".additional-container").hide();
        $(".additional-upload").show();

        // Load initial data
        loadInitialData();

        // Set up event listeners
        setupEventListeners();
    }

    function loadInitialData() {
        productData = {
            productName: "",
            category: "",
            salePrice: "",
            costPrice: "",
            inventory: 0,
            orderType: "",
            hasDiscount: false,
            discountType: "",
            discountValue: "",
            hasExpiry: true,
            expiryDate: "۱۴۰۳/۰۹/۲۲",
            shortDescription: "",
            fullDescription: "",
            hasReturnPolicy: false,
            returnPeriod: "",
            dateAdded: "۱۴۰۳/۰۹/۲۲",
            timeAdded: "۱۲:۳۰",
            mainMedia: null,
            mainMediaType: "",
            additionalMedia: [],
        };
    }

    function setupEventListeners() {
        // Input change listeners
        $("[data-field]").on("input change", function () {
            const field = $(this).data("field");
            const value = $(this).val() || $(this).is(":checked");
            updateProductData(field, value);
        });

        // Dropdown listeners
        $(".custom-dropdown").on("click", function (e) {
            e.stopPropagation();
            const $dropdown = $(this);
            const $menu = $dropdown.find(".dropdown-menu-custom");
            const $trigger = $dropdown.find(".dropdown-trigger");

            // Close other dropdowns
            $(".dropdown-menu-custom").not($menu).removeClass("active");
            $(".dropdown-trigger").not($trigger).removeClass("active");

            // Toggle current dropdown
            $menu.toggleClass("active");
            $trigger.toggleClass("active");
        });

        // Dropdown item selection
        $(".dropdown-item-custom").on("click", function (e) {
            e.stopPropagation();
            const $item = $(this);
            const $dropdown = $item.closest(".custom-dropdown");
            const $value = $dropdown.find(".dropdown-value");
            const $trigger = $dropdown.find(".dropdown-trigger");
            const $menu = $dropdown.find(".dropdown-menu-custom");

            const selectedValue = $item.data("value");
            const selectedText = $item.text();
            const field = $dropdown.data("field");

            $value.text(selectedText).addClass("selected");
            $menu.removeClass("active");
            $trigger.removeClass("active");

            updateProductData(field, selectedValue);
        });

        // Close dropdowns when clicking outside
        $(document).on("click", () => {
            $(".dropdown-menu-custom").removeClass("active");
            $(".dropdown-trigger").removeClass("active");
        });

        // Quantity controls
        $(".quantity-up").on("click", () => {
            const $input = $(".quantity-input");
            const currentValue = Number.parseInt($input.val()) || 0;
            const newValue = currentValue + 1;
            $input.val(newValue);
            updateProductData("inventory", newValue);
        });

        $(".quantity-down").on("click", () => {
            const $input = $(".quantity-input");
            const currentValue = Number.parseInt($input.val()) || 0;
            if (currentValue > 0) {
                const newValue = currentValue - 1;
                $input.val(newValue);
                updateProductData("inventory", newValue);
            }
        });

        // Toggle functionality
        $(".switch-input").on("change", function () {
            const $toggle = $(this);
            const toggleId = $toggle.attr("id");
            const contentId = "#" + toggleId.replace("Toggle", "Content");
            const $content = $(contentId);
            const field = $toggle.data("field");

            if ($toggle.is(":checked")) {
                $content.addClass("show");
                updateProductData(field, true);
            } else {
                $content.removeClass("show");
                updateProductData(field, false);
            }
        });

        // Main media upload handlers
        $("#uploadZone").on("click", () => {
            $("#mainFileInput").click();
        });

        $("#mainFileInput").on("change", function () {
            const file = this.files[0];
            if (file) {
                handleMainMediaUpload(file);
            }
        });

        $("#deleteBtn").on("click", (e) => {
            e.stopPropagation();
            deleteMainMedia();
        });

        $("#rotateBtn").on("click", (e) => {
            e.stopPropagation();
            rotateMainImage();
        });

        // Additional media handlers - Fix event delegation
        $(document).on("click", ".additional-upload", function () {
            const $item = $(this).closest(".additional-item");
            currentAdditionalTarget = $item;
            $("#additionalFileInput").click();
        });

        $(document).on("click", ".delete-additional", function (e) {
            e.stopPropagation();
            const $item = $(this).closest(".additional-item");
            deleteAdditionalMedia($item);
        });

        $("#additionalFileInput").on("change", function () {
            const file = this.files[0];
            if (file && currentAdditionalTarget) {
                handleAdditionalMediaUpload(file, currentAdditionalTarget);
            }
        });

        // Rich text editor
        setupRichTextEditor();

        // Form actions
        $("#saveBtn").on("click", () => {
            handleSave();
        });

        $("#publishBtn").on("click", () => {
            handlePublish();
        });

        // Modal close
        $("#closeModal").on("click", () => {
            hideModal();
        });

        // Price formatting
        $(".price-input").on("input", function () {
            formatPriceInput($(this));
        });
    }

    function updateProductData(field, value) {
        productData[field] = value;
        // console.log("Product data updated:", field, value);
    }

    function isVideoFile(file) {
        return file.type.startsWith("video/");
    }

    function isImageFile(file) {
        return file.type.startsWith("image/");
    }

    function validateFileSize(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        return file.size <= maxSize;
    }

    function handleMainMediaUpload(file) {
        if (!validateFileSize(file)) {
            alert("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const $container = $("#imageContainer");
            const $image = $("#mainImage");
            const $video = $("#mainVideo");
            const $rotateBtn = $("#rotateBtn");

            // Hide upload zone and show container
            $("#uploadZone").hide();
            $container.show().addClass("fade-in");

            if (isVideoFile(file)) {
                // Handle video
                $image.hide();
                $video.show();
                $video.find("source").attr("src", e.target.result);
                $video[0].load(); // Reload video element
                $rotateBtn.hide(); // Can't rotate videos

                // Add media type indicator
                if (!$container.find(".media-type-indicator").length) {
                    $container.prepend(
                        '<div class="media-type-indicator">ویدیو</div>'
                    );
                }

                updateProductData("mainMedia", e.target.result);
                updateProductData("mainMediaType", "video");
            } else if (isImageFile(file)) {
                // Handle image
                $video.hide();
                $image.show();
                $image.attr("src", e.target.result);
                $rotateBtn.show(); // Can rotate images

                // Remove video indicator if exists
                $container.find(".media-type-indicator").remove();

                updateProductData("mainMedia", e.target.result);
                updateProductData("mainMediaType", "image");
            }
        };
        reader.readAsDataURL(file);
    }

    function deleteMainMedia() {
        $("#imageContainer").hide();
        $("#uploadZone").show().addClass("fade-in");
        $("#mainFileInput").val("");
        $("#mainImage").attr("src", "").hide();
        $("#mainVideo").find("source").attr("src", "");
        $("#mainVideo").hide();
        $("#imageContainer").find(".media-type-indicator").remove();
        updateProductData("mainMedia", null);
        updateProductData("mainMediaType", "");
    }

    function rotateMainImage() {
        const $img = $("#mainImage");
        if ($img.is(":visible")) {
            const currentRotation = Number.parseInt($img.data("rotation") || 0);
            const newRotation = currentRotation + 90;
            $img.css("transform", `rotate(${newRotation}deg)`);
            $img.data("rotation", newRotation);
        }
    }

    function handleAdditionalMediaUpload(file, $item) {
        if (!validateFileSize(file)) {
            alert("حجم فایل نباید بیشتر از ۱۰ مگابایت باشد");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const index = $item.data("index");
            const $container = $item.find(".additional-container");
            const $upload = $item.find(".additional-upload");
            const $image = $item.find(".additional-image");
            const $video = $item.find(".additional-video");

            console.log("Uploading to index:", index); // Debug log

            if (isVideoFile(file)) {
                // Handle video
                $image.hide();
                $video.show();
                $video.find("source").attr("src", e.target.result);
                $video[0].load();

                // Add media type indicator
                if (!$container.find(".media-type-indicator").length) {
                    $container.prepend(
                        '<div class="media-type-indicator">ویدیو</div>'
                    );
                }

                additionalMedia[index] = {
                    data: e.target.result,
                    type: "video",
                    name: file.name,
                };
            } else if (isImageFile(file)) {
                // Handle image
                $video.hide();
                $image.show().attr("src", e.target.result);

                // Remove video indicator if exists
                $container.find(".media-type-indicator").remove();

                additionalMedia[index] = {
                    data: e.target.result,
                    type: "image",
                    name: file.name,
                };
            }

            // Show container and hide upload - FIXED
            $upload.hide();
            $container.show().removeClass("fade-in").addClass("fade-in");

            console.log("Media uploaded successfully:", additionalMedia[index]); // Debug log
            updateProductData("additionalMedia", additionalMedia);
        };
        reader.readAsDataURL(file);
    }

    function deleteAdditionalMedia($item) {
        const index = $item.data("index");
        const $container = $item.find(".additional-container");
        const $upload = $item.find(".additional-upload");
        const $image = $item.find(".additional-image");
        const $video = $item.find(".additional-video");

        // Hide container and show upload
        $container.hide();
        $upload.show().removeClass("fade-in").addClass("fade-in");

        // Clear media elements
        $image.attr("src", "/placeholder.svg").hide();
        $video.find("source").attr("src", "/placeholder.svg");
        $video.hide();
        $container.find(".media-type-indicator").remove();

        // Clear file input
        $("#additionalFileInput").val("");

        additionalMedia[index] = null;
        updateProductData("additionalMedia", additionalMedia);

        console.log("Media deleted from index:", index); // Debug log
    }

    function setupRichTextEditor() {
        const $editor = $("#editorContent");

        $editor.on("focus", function () {
            const $placeholder = $(this).find(".editor-placeholder");
            if ($placeholder.length) {
                $placeholder.remove();
            }
        });

        $editor.on("blur", function () {
            const content = $(this).text().trim();
            if (content === "") {
                $(this).html(
                    '<p class="editor-placeholder">توضیحات کامل محصول خود را اینجا بنویسید...</p>'
                );
                updateProductData("fullDescription", "");
            } else {
                updateProductData("fullDescription", $(this).html());
            }
        });

        $editor.on("input", function () {
            const content = $(this).html();
            updateProductData("fullDescription", content);
        });

        // Toolbar functionality
        $(".toolbar-btn").on("click", function (e) {
            e.preventDefault();
            const command = $(this).data("cmd");

            if (command === "createLink") {
                const url = prompt("آدرس لینک را وارد کنید:");
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, null);
            }

            $(this).toggleClass("active");
            $editor.focus();
        });
    }

    // Replace the existing formatPriceInput function
    function formatPriceInput($input) {
        let value = $input.val().replace(/[^\d]/g, "");
        if (value) {
            // Format as string instead of converting to number
            let formatted = "";
            for (let i = value.length - 1, j = 0; i >= 0; i--, j++) {
                if (j > 0 && j % 3 === 0) {
                    formatted = "،" + formatted;
                }
                formatted = value[i] + formatted;
            }
            value = formatted;
        }
        $input.val(value);
    }

    function validateForm() {
        const errors = [];

        if (!productData.productName || productData.productName.trim() === "") {
            errors.push("نام محصول الزامی است");
        }

        if (!productData.category) {
            errors.push("انتخاب دسته‌بندی الزامی است");
        }

        if (!productData.salePrice || productData.salePrice.trim() === "") {
            errors.push("قیمت فروش الزامی است");
        }

        if (errors.length > 0) {
            alert("خطاهای زیر را برطرف کنید:\n" + errors.join("\n"));
            return false;
        }

        return true;
    }

    function collectFormData() {
        // Update product data with current form values
        $("[data-field]").each(function () {
            const field = $(this).data("field");
            const value = $(this).is(":checkbox")
                ? $(this).is(":checked")
                : $(this).val();
            productData[field] = value;
        });

        // Get selected dropdown values
        $(".custom-dropdown").each(function () {
            const field = $(this).data("field");
            const $value = $(this).find(".dropdown-value");
            if ($value.hasClass("selected")) {
                productData[field] = $value.text();
            }
        });

        // Get editor content
        const editorContent = $("#editorContent").html();
        productData.fullDescription = editorContent;

        // Clean up and format data
        const finalData = {
            ...productData,
            salePrice: productData.salePrice
                ? parseInt(productData.salePrice.replace(/[^\d]/g, ""), 10)
                : 0,
            costPrice: productData.costPrice
                ? parseInt(productData.costPrice.replace(/[^\d]/g, ""), 10)
                : 0,
            inventory: Number.parseInt(productData.inventory) || 0,
            discountValue: productData.discountValue
                ? Number.parseInt(
                      productData.discountValue.replace(/[^\d]/g, "")
                  )
                : 0,
            returnPeriod: productData.returnPeriod
                ? Number.parseInt(
                      productData.returnPeriod.replace(/[^\d]/g, "")
                  )
                : 0,
            additionalMedia: additionalMedia.filter(
                (media) => media !== null && media !== undefined
            ),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return finalData;
    }

    function handleSave() {
        if (!validateForm()) return;

        const $btn = $("#saveBtn");
        $btn.addClass("loading");

        // Simulate API call
        setTimeout(() => {
            const formData = collectFormData();

            // Log the JSON data that would be sent to server
            console.log(
                "Saving product data:",
                JSON.stringify(formData, null, 2)
            );

            $btn.removeClass("loading");
            showSuccessModal("محصول با موفقیت در پیش‌نویس ذخیره شد");

            return formData;
        }, 2000);
    }

    function handlePublish() {
        if (!validateForm()) return;

        const $btn = $("#publishBtn");
        $btn.addClass("loading");

        // Simulate API call
        setTimeout(() => {
            const formData = collectFormData();
            formData.status = "published";
            formData.publishedAt = new Date().toISOString();

            // Log the JSON data that would be sent to server
            console.log(
                "Publishing product data:",
                JSON.stringify(formData, null, 2)
            );

            $btn.removeClass("loading");
            showSuccessModal(
                "محصول با موفقیت منتشر شد و اکنون در فروشگاه نمایش داده می‌شود"
            );

            return formData;
        }, 3000);
    }

    function showSuccessModal(message) {
        $("#successMessage").text(message);
        $("#successModal").addClass("show");
    }

    function hideModal() {
        $("#successModal").removeClass("show");
    }

    // Auto-save functionality
    let autoSaveTimer;
    $("[data-field]").on("input change", () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            const formData = collectFormData();
            // console.log("Auto-saved:", new Date().toLocaleString("fa-IR"));
            localStorage.setItem("productDraft", JSON.stringify(formData));
        }, 3000);
    });

    // Load draft from localStorage on page load
    const savedDraft = localStorage.getItem("productDraft");
    if (savedDraft) {
        try {
            const draftData = JSON.parse(savedDraft);
            console.log("Draft found in localStorage:", draftData);
        } catch (e) {
            console.error("Error loading draft:", e);
        }
    }

    // Persian number conversion
    function toPersianNumbers(str) {
        const persianNumbers = [
            "۰",
            "۱",
            "۲",
            "۳",
            "۴",
            "۵",
            "۶",
            "۷",
            "۸",
            "۹",
        ];
        return str.toString().replace(/[0-9]/g, (w) => persianNumbers[+w]);
    }

    // Convert existing numbers to Persian
    $(".date-input, .time-input").each(function () {
        const value = $(this).val();
        if (value) {
            $(this).val(toPersianNumbers(value));
        }
    });

    // Debug function to check additional media state
    function debugAdditionalMedia() {
        $(".additional-item").each(function (index) {
            const $item = $(this);
            const $container = $item.find(".additional-container");
            const $upload = $item.find(".additional-upload");
            console.log(`Item ${index}:`, {
                containerVisible: $container.is(":visible"),
                uploadVisible: $upload.is(":visible"),
                hasImage:
                    $item.find(".additional-image").attr("src") !==
                    "/placeholder.svg",
                hasVideo:
                    $item.find(".additional-video source").attr("src") !==
                    "/placeholder.svg",
            });
        });
    }

    // Expose debug function globally
    window.debugAdditionalMedia = debugAdditionalMedia;

    // Expose functions globally for debugging
    window.getProductData = () => collectFormData();

    window.setProductData = (data) => {
        productData = { ...productData, ...data };
        console.log("Product data updated externally:", productData);
    };
});
