(() => {
    // Declare required dependencies
    const jalaali = window.jalaali;
    const $ = window.$;
    const showNotification = window.showNotification;

    // Check if required dependencies are available
    if (typeof jalaali === "undefined") {
        console.error("jalaali library is required but not found");
        return;
    }

    if (typeof $ === "undefined") {
        console.error("jQuery is required but not found");
        return;
    }

    // Jalali Calendar Configuration
    const jalaliMonths = [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند",
    ];

    // Simple Jalali Date Class
    class JalaliDate {
        constructor(jy = null, jm = null, jd = null) {
            if (jy === null) {
                const now = new Date();
                const jalali = jalaali.toJalaali(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    now.getDate()
                );
                this.jy = jalali.jy;
                this.jm = jalali.jm;
                this.jd = jalali.jd;
            } else {
                this.jy = jy;
                this.jm = jm;
                this.jd = jd;
            }
        }

        year() {
            return this.jy;
        }
        month() {
            return this.jm;
        }
        date() {
            return this.jd;
        }

        clone() {
            return new JalaliDate(this.jy, this.jm, this.jd);
        }

        subtract(amount, unit) {
            if (unit === "day") {
                const gregorian = jalaali.toGregorian(
                    this.jy,
                    this.jm,
                    this.jd
                );
                const date = new Date(
                    gregorian.gy,
                    gregorian.gm - 1,
                    gregorian.gd
                );
                date.setDate(date.getDate() - amount);
                const jalali = jalaali.toJalaali(
                    date.getFullYear(),
                    date.getMonth() + 1,
                    date.getDate()
                );
                return new JalaliDate(jalali.jy, jalali.jm, jalali.jd);
            }
            return this;
        }

        add(amount, unit) {
            if (unit === "month") {
                let newMonth = this.jm + amount;
                let newYear = this.jy;

                while (newMonth > 12) {
                    newMonth -= 12;
                    newYear++;
                }
                while (newMonth < 1) {
                    newMonth += 12;
                    newYear--;
                }

                const daysInNewMonth = this.getDaysInMonth(newYear, newMonth);
                const newDay = Math.min(this.jd, daysInNewMonth);

                this.jy = newYear;
                this.jm = newMonth;
                this.jd = newDay;
            }
            return this;
        }

        getDaysInMonth(year, month) {
            if (month <= 6) return 31;
            if (month <= 11) return 30;
            return jalaali.isLeapJalaaliYear(year) ? 30 : 29;
        }

        getFirstDayOfMonth() {
            const gregorian = jalaali.toGregorian(this.jy, this.jm, 1);
            const date = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
            return (date.getDay() + 1) % 7;
        }

        isSame(other) {
            return (
                this.jy === other.jy &&
                this.jm === other.jm &&
                this.jd === other.jd
            );
        }

        isAfter(other) {
            if (this.jy > other.jy) return true;
            if (this.jy < other.jy) return false;
            if (this.jm > other.jm) return true;
            if (this.jm < other.jm) return false;
            return this.jd > other.jd;
        }

        isBefore(other) {
            if (this.jy < other.jy) return true;
            if (this.jy > other.jy) return false;
            if (this.jm < other.jm) return true;
            if (this.jm > other.jm) return false;
            return this.jd < other.jd;
        }

        format() {
            return `${this.jd} / ${this.jm} / ${this.jy}`;
        }
    }

    // DateTimePicker Instance Class
    class PersianDateTimePickerInstance {
        constructor(instanceId, targetElement, type) {
            this.instanceId = instanceId;
            this.targetElement = targetElement;
            this.type = type; // 'date' or 'time'
            this.dtSelectedDate = new JalaliDate();
            this.dtSelectedTime = { hour: "", minute: "" };
            this.dtCurrentCalendarDate = new JalaliDate();
            this.dtCurrentView = "days";
            this.dtYearSelectorStartYear =
                Math.floor(this.dtCurrentCalendarDate.year() / 12) * 12;
            this.dtCalendarModal = null;
            this.isInitialized = false;

            this.initializeDateTimePicker();
        }

        initializeDateTimePicker() {
            if (this.isInitialized) return;

            if (this.type === "date") {
                this.createCalendarModal();
                this.bindCalendarEvents();
                this.setCurrentTime();
                this.updateDateDisplay();
            } else if (this.type === "time") {
                this.bindTimeEvents();
                this.initializeTimeScrollers();
                this.setCurrentTime();
                this.updateTimeDisplay();
            }

            this.isInitialized = true;
        }

        createCalendarModal() {
            const modalHtml = `
                <div class="dt-calendar-modal" id="dtCalendarModal_${this.instanceId}" style="display: none;">
                    <div class="calendar-container">
                        <div class="calendar-header">
                            <button class="calendar-nav-btn" id="dtPrevMonth_${this.instanceId}">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <div class="calendar-title">
                                <span id="dtCurrentMonth_${this.instanceId}" class="clickable-title"></span>
                                <span id="dtCurrentYear_${this.instanceId}" class="clickable-title"></span>
                            </div>
                            <button class="calendar-nav-btn" id="dtNextMonth_${this.instanceId}">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                        </div>

                        <div class="dt-month-selector" id="dtMonthSelector_${this.instanceId}" style="display: none;">
                            <div class="month-selector-header">
                                <div class="month-selector-title">انتخاب ماه</div>
                            </div>
                            <div class="month-selector-grid" id="dtMonthGrid_${this.instanceId}"></div>
                        </div>

                        <div class="dt-year-selector" id="dtYearSelector_${this.instanceId}" style="display: none;">
                            <div class="year-selector-header">
                                <button class="calendar-nav-btn" id="dtPrevYearPage_${this.instanceId}">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                                <div class="year-selector-title" id="dtYearRangeDisplay_${this.instanceId}"></div>
                                <button class="calendar-nav-btn" id="dtNextYearPage_${this.instanceId}">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                            </div>
                            <div class="year-selector-grid" id="dtYearGrid_${this.instanceId}"></div>
                        </div>

                        <div class="calendar-weekdays" id="dtCalendarWeekdays_${this.instanceId}">
                            <div class="weekday">ش</div>
                            <div class="weekday">ی</div>
                            <div class="weekday">د</div>
                            <div class="weekday">س</div>
                            <div class="weekday">چ</div>
                            <div class="weekday">پ</div>
                            <div class="weekday">ج</div>
                        </div>

                        <div class="calendar-days" id="dtCalendarDays_${this.instanceId}"></div>

                        <div class="calendar-actions">
                            <button class="calendar-reset-btn" id="dtCalendarResetBtn_${this.instanceId}">
                                <i class="fas fa-times"></i>
                                <span>پاک کردن</span>
                            </button>
                            <button class="calendar-close-btn" id="dtCalendarCloseBtn_${this.instanceId}">
                                <i class="fas fa-check"></i>
                                <span>تایید</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            $("body").append(modalHtml);
            this.dtCalendarModal = $(`#dtCalendarModal_${this.instanceId}`);
        }

        bindCalendarEvents() {
            // Bind to target element
            $(this.targetElement).on("click", () => this.openCalendarModal());

            // Calendar navigation
            $(`#dtPrevMonth_${this.instanceId}`).on("click", () =>
                this.navigateMonth(-1)
            );
            $(`#dtNextMonth_${this.instanceId}`).on("click", () =>
                this.navigateMonth(1)
            );
            $(`#dtCalendarResetBtn_${this.instanceId}`).on("click", () =>
                this.resetDate()
            );
            $(`#dtCalendarCloseBtn_${this.instanceId}`).on("click", () =>
                this.closeCalendarModal()
            );

            // Month and Year selector events
            $(`#dtCurrentMonth_${this.instanceId}`).on("click", () =>
                this.toggleMonthSelector()
            );
            $(`#dtCurrentYear_${this.instanceId}`).on("click", () =>
                this.toggleYearSelector()
            );
            $(`#dtPrevYearPage_${this.instanceId}`).on("click", () =>
                this.navigateYearPage(-1)
            );
            $(`#dtNextYearPage_${this.instanceId}`).on("click", () =>
                this.navigateYearPage(1)
            );

            // Close modal when clicking outside
            this.dtCalendarModal.on("click", (e) => {
                if ($(e.target).is(this.dtCalendarModal)) {
                    this.closeCalendarModal();
                }
            });
        }

        bindTimeEvents() {
            // Bind to target element
            $(this.targetElement).on("click", () => this.openTimeModal());

            // Time modal events
            $("#closeTimeBtn").on("click", () => this.closeTimeModal());
            $("#clearTimeBtn").on("click", () => this.clearTime());
            $("#confirmTimeBtn").on("click", () => this.confirmTime());
        }

        openCalendarModal() {
            if (this.dtSelectedDate) {
                this.dtCurrentCalendarDate = this.dtSelectedDate.clone();
            } else {
                this.dtCurrentCalendarDate = new JalaliDate();
            }

            this.dtCurrentView = "days";
            this.dtYearSelectorStartYear =
                Math.floor(this.dtCurrentCalendarDate.year() / 12) * 12;
            this.updateCalendarDisplay();
            this.dtCalendarModal.addClass("d-flex").show();
            $("body").css("overflow", "hidden");
        }

        closeCalendarModal() {
            this.dtCalendarModal.removeClass("d-flex").hide();
            $("body").css("overflow", "");
            this.dtCurrentView = "days";
        }

        navigateMonth(direction) {
            if (this.dtCurrentView !== "days") return;
            this.dtCurrentCalendarDate.add(direction, "month");
            this.updateCalendarDisplay();
        }

        updateCalendarDisplay() {
            $(`#dtCurrentMonth_${this.instanceId}`).text(
                jalaliMonths[this.dtCurrentCalendarDate.month() - 1]
            );
            $(`#dtCurrentYear_${this.instanceId}`).text(
                this.dtCurrentCalendarDate.year()
            );

            // Hide all sections first
            $(`#dtMonthSelector_${this.instanceId}`).hide();
            $(`#dtYearSelector_${this.instanceId}`).hide();
            $(`#dtCalendarWeekdays_${this.instanceId}`).hide();
            $(`#dtCalendarDays_${this.instanceId}`).hide();

            // Show only the current view section
            switch (this.dtCurrentView) {
                case "days":
                    $(`#dtCalendarWeekdays_${this.instanceId}`).show();
                    $(`#dtCalendarDays_${this.instanceId}`).show();
                    this.renderCalendarDays();
                    break;
                case "months":
                    $(`#dtMonthSelector_${this.instanceId}`).show();
                    this.renderMonthSelector();
                    break;
                case "years":
                    $(`#dtYearSelector_${this.instanceId}`).show();
                    this.renderYearSelector();
                    break;
            }
        }

        renderCalendarDays() {
            const $calendarDays = $(`#dtCalendarDays_${this.instanceId}`);
            $calendarDays.empty();

            const year = this.dtCurrentCalendarDate.year();
            const month = this.dtCurrentCalendarDate.month();
            const firstDay = new JalaliDate(year, month, 1);
            const startDayOfWeek = firstDay.getFirstDayOfMonth();
            const daysInMonth = firstDay.getDaysInMonth(year, month);
            const today = new JalaliDate();

            // Add empty cells for days before month starts
            for (let i = 0; i < startDayOfWeek; i++) {
                const emptyDay = $("<div>").addClass(
                    "calendar-day other-month"
                );
                $calendarDays.append(emptyDay);
            }

            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new JalaliDate(year, month, day);
                const dayElement = $("<div>")
                    .addClass("calendar-day")
                    .text(day);

                if (
                    this.dtSelectedDate &&
                    dayDate.isSame(this.dtSelectedDate)
                ) {
                    dayElement.addClass("selected");
                }

                if (dayDate.isSame(today)) {
                    dayElement.addClass("today");
                }

                dayElement.on("click", () => {
                    this.selectDate(new JalaliDate(year, month, day));
                });

                $calendarDays.append(dayElement);
            }
        }

        toggleMonthSelector() {
            this.dtCurrentView =
                this.dtCurrentView === "months" ? "days" : "months";
            this.updateCalendarDisplay();
        }

        renderMonthSelector() {
            const $monthGrid = $(`#dtMonthGrid_${this.instanceId}`);
            $monthGrid.empty();

            jalaliMonths.forEach((monthName, index) => {
                const monthElement = $("<div>")
                    .addClass("month-item")
                    .text(monthName);

                if (index + 1 === this.dtCurrentCalendarDate.month()) {
                    monthElement.addClass("selected");
                }

                monthElement.on("click", () => {
                    this.selectMonth(index + 1);
                });

                $monthGrid.append(monthElement);
            });
        }

        selectMonth(month) {
            this.dtCurrentCalendarDate = new JalaliDate(
                this.dtCurrentCalendarDate.year(),
                month,
                1
            );
            this.dtCurrentView = "days";
            this.updateCalendarDisplay();
        }

        toggleYearSelector() {
            this.dtCurrentView =
                this.dtCurrentView === "years" ? "days" : "years";
            this.updateCalendarDisplay();
        }

        navigateYearPage(direction) {
            this.dtYearSelectorStartYear += direction * 12;
            this.renderYearSelector();
        }

        renderYearSelector() {
            const $yearRangeDisplay = $(
                `#dtYearRangeDisplay_${this.instanceId}`
            );
            const $yearGrid = $(`#dtYearGrid_${this.instanceId}`);

            $yearRangeDisplay.text(
                `${this.dtYearSelectorStartYear} - ${
                    this.dtYearSelectorStartYear + 11
                }`
            );
            $yearGrid.empty();

            for (let i = 0; i < 12; i++) {
                const year = this.dtYearSelectorStartYear + i;
                const yearElement = $("<div>").addClass("year-item").text(year);

                if (year === this.dtCurrentCalendarDate.year()) {
                    yearElement.addClass("selected");
                }

                yearElement.on("click", () => {
                    this.selectYear(year);
                });

                $yearGrid.append(yearElement);
            }
        }

        selectYear(year) {
            this.dtCurrentCalendarDate = new JalaliDate(
                year,
                this.dtCurrentCalendarDate.month(),
                1
            );
            this.dtCurrentView = "days";
            this.updateCalendarDisplay();
        }

        selectDate(date) {
            this.dtSelectedDate = date;
            this.updateDateDisplay();
            this.renderCalendarDays();
            this.closeCalendarModal();

            if (typeof showNotification === "function") {
                showNotification("تاریخ با موفقیت انتخاب شد!", "success");
            }
        }

        resetDate() {
            this.dtSelectedDate = null;
            $(this.targetElement).val("");
            this.renderCalendarDays();
            this.closeCalendarModal();
        }

        updateDateDisplay() {
            if (this.dtSelectedDate) {
                $(this.targetElement).val(this.dtSelectedDate.format());
            }
        }

        // Time functions
        initializeTimeScrollers() {
            const $hourScroll = $("#hourScroll");
            const $minuteScroll = $("#minuteScroll");

            // Clear existing items
            $hourScroll.empty();
            $minuteScroll.empty();

            // Generate hours (00-23)
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, "0");
                const $hourItem = $(
                    `<div class="time-item" data-value="${i}">${hour}</div>`
                );
                $hourScroll.append($hourItem);
            }

            // Generate minutes (00-59)
            for (let i = 0; i < 60; i++) {
                const minute = i.toString().padStart(2, "0");
                const $minuteItem = $(
                    `<div class="time-item" data-value="${i}">${minute}</div>`
                );
                $minuteScroll.append($minuteItem);
            }

            // Bind time item clicks
            $(".time-item")
                .off("click.datetime")
                .on("click.datetime", (e) => {
                    const $this = $(e.target);
                    const value = Number.parseInt($this.data("value"));

                    if ($this.parent().is($hourScroll)) {
                        this.dtSelectedTime.hour = value;
                        $hourScroll.find(".time-item").removeClass("selected");
                        $this.addClass("selected");
                    } else {
                        this.dtSelectedTime.minute = value;
                        $minuteScroll
                            .find(".time-item")
                            .removeClass("selected");
                        $this.addClass("selected");
                    }
                });
        }

        setCurrentTime() {
            const now = new Date();
            this.dtSelectedTime.hour = now.getHours();
            this.dtSelectedTime.minute = now.getMinutes();
            this.updateTimeDisplay();
        }

        openTimeModal() {
            const $timeModal = $(".timeModal");
            const $hourScroll = $("#hourScroll");
            const $minuteScroll = $("#minuteScroll");

            // Set current selections
            $hourScroll.find(".time-item").removeClass("selected");
            $minuteScroll.find(".time-item").removeClass("selected");
            $hourScroll
                .find(`[data-value="${this.dtSelectedTime.hour}"]`)
                .addClass("selected");
            $minuteScroll
                .find(`[data-value="${this.dtSelectedTime.minute}"]`)
                .addClass("selected");

            // Scroll to selected items
            setTimeout(() => {
                this.scrollToSelected($hourScroll, this.dtSelectedTime.hour);
                this.scrollToSelected(
                    $minuteScroll,
                    this.dtSelectedTime.minute
                );
            }, 100);

            $timeModal.addClass("show").show();
            $("body").css("overflow", "hidden");
        }

        closeTimeModal() {
            $(".timeModal").removeClass("show").hide();
            $("body").css("overflow", "");
        }

        scrollToSelected($container, value) {
            const $selected = $container.find(`[data-value="${value}"]`);
            if ($selected.length) {
                const containerHeight = $container.height();
                const itemHeight = $selected.outerHeight();
                const scrollTop =
                    $selected.position().top -
                    containerHeight / 2 +
                    itemHeight / 2;
                $container.scrollTop($container.scrollTop() + scrollTop);
            }
        }

        clearTime() {
            this.dtSelectedTime = { hour: 12, minute: 0 };
            $(this.targetElement).val("");
            this.closeTimeModal();
        }

        confirmTime() {
            this.updateTimeDisplay();
            this.closeTimeModal();

            if (typeof showNotification === "function") {
                showNotification("زمان با موفقیت انتخاب شد!", "success");
            }
        }

        updateTimeDisplay() {
            const timeString = `${this.dtSelectedTime.hour
                .toString()
                .padStart(2, "0")}:${this.dtSelectedTime.minute
                .toString()
                .padStart(2, "0")}`;
            $(this.targetElement).val(timeString);
        }

        // Public API methods
        getSelectedDate() {
            return this.dtSelectedDate;
        }

        getSelectedTime() {
            return this.dtSelectedTime;
        }

        setDate(jy, jm, jd) {
            this.dtSelectedDate = new JalaliDate(jy, jm, jd);
            this.dtCurrentCalendarDate = this.dtSelectedDate.clone();
            this.updateDateDisplay();
            this.updateCalendarDisplay();
        }

        setTime(hour, minute) {
            this.dtSelectedTime = { hour, minute };
            this.updateTimeDisplay();
        }

        clearAll() {
            this.dtSelectedDate = null;
            this.dtSelectedTime = { hour: 12, minute: 0 };
            $(this.targetElement).val("");
        }
    }

    // Factory function to create Persian DateTime Pickers
    function createPersianDateTimePickers(config) {
        const instances = [];
        let instanceCounter = 0;

        // Process date selector arrays
        if (config.dateSelectors && Array.isArray(config.dateSelectors)) {
            config.dateSelectors.forEach((selector) => {
                $(selector).each(function () {
                    const instance = new PersianDateTimePickerInstance(
                        `date_${instanceCounter++}`,
                        this,
                        "date"
                    );
                    instances.push(instance);
                });
            });
        }

        // Process time selector arrays
        if (config.timeSelectors && Array.isArray(config.timeSelectors)) {
            config.timeSelectors.forEach((selector) => {
                $(selector).each(function () {
                    const instance = new PersianDateTimePickerInstance(
                        `time_${instanceCounter++}`,
                        this,
                        "time"
                    );
                    instances.push(instance);
                });
            });
        }

        return {
            instances: instances,
            getInstanceByElement: (element) =>
                instances.find(
                    (instance) => instance.targetElement === element
                ),
            clearAll: () => {
                instances.forEach((instance) => instance.clearAll());
            },
            getInstancesByType: (type) =>
                instances.filter((instance) => instance.type === type),
        };
    }

    // Export functions for external use
    window.createPersianDateTimePickers = createPersianDateTimePickers;
    window.PersianDateTimePickerInstance = PersianDateTimePickerInstance;
})();

// Initialize with arrays of class selectors
const pickers = createPersianDateTimePickers({
    dateSelectors: [".date-input", ".order-date", "#startDate"],
    timeSelectors: [".time-input", ".order-time", "#startTime"],
});

// Access specific instance by element
const dateInstance = pickers.getInstanceByElement(
    document.getElementById("startDate")
);

// Get all date picker instances
const dateInstances = pickers.getInstancesByType("date");

// Get all time picker instances
const timeInstances = pickers.getInstancesByType("time");

// Control individual instances
dateInstance.setDate(1403, 1, 15);
timeInstance.setTime(14, 30);

// Clear all pickers
pickers.clearAll();
