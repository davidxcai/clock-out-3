$(document).ready(function () {
  (function () {
    const date = new Date();
    $("#Footer").html(`© ${date.getFullYear()} David Cai`);

    // todo:
    // input validation; prevent users from entering negative digits

    // Prevent unwanted characters from being entered in form
    $.fn.inputFilter = function(inputFilter) {
      return this.on("input", function() {
          if (inputFilter(this.value)) {
              this.oldValue = this.value;
          } else if (this.hasOwnProperty("oldValue")) {
              this.value = this.oldValue;
          } else {
              this.value = "";
          }
      });
  };

  //Filters
  $("#ClockInHour").inputFilter(function (value) {
      return /^\d*$/.test(value) && (value === "" || parseInt(value) <= 24);
  });
  $(".minute").inputFilter(function (value) {
      return /^\d*$/.test(value) && (value === "" || parseInt(value) <= 59);
  });

    function Time() {
      const values = {
        clockIn: {
          hour: 0,
          minute: 0
        },
        working: {
          hour: 0,
          minute: 0
        },
        lunch: 30,
        meeting: 0,
        lost: 0,
        productivity: 0.95,
        ampm: "AM"
      };

      function set(input) {
        const value = Math.abs(Number(input.value));
        switch (input.id) {
          case "ClockInHour":
            values.clockIn.hour = (value % 12 === 0) ? 12 : value % 12;
            break;
          case "ClockInMinute":
            values.clockIn.minute = value;
            break;
          case "WorkingHour":
            values.working.hour = value;
            break;
          case "WorkingMinute":
            values.working.minute = value;
            break;
          case "Lunch":
            values.lunch = value;
            break;
          case "Meeting":
            values.meeting = value;
            break;
          case "LostTime":
            values.lost = value;
            break;
          case "Productivity":
            values.productivity = value / 100;
            break;
          case "AM":
          case "PM":
            values.ampm = input.value;
            break;
          default:
            console.log('Switch case error; unknown input field.');
        }
      }

      return {
        set: set,
        values: values
      };
    }

    const time = Time();

    $(".input").on("input", function () {
      let currentValue = $(this).val();
      let id = $(this).id;

      // Use a regex that matches numbers between 0 and 59 or a single digit
      // const regex = /^(?:[0-5]?[0-9])$/;

      // // Check if the current value is valid
      // if (!regex.test(currentValue)) {
      //   // If not valid, truncate the value to the last valid state or clear if no valid state
      //   $(this).val(currentValue.slice(0, 2).replace(/[^0-9]/g, ''));
      // }

      time.set(this);
      Validate(time.values);
    });

    // Validate time values to check if they are undefined
    const Validate = (input) => {
      if (input.clockIn.hour > 0 && input.productivity > 0) {
        if (input.working.hour > 0 || input.working.minute > 0) {
          calculateClockOutTime();
        } else {
          UpdateDisplay();
        }
      } else {
        UpdateDisplay();
      }
    }

    const calculateClockOutTime = () => {
      // Calculate total minutes worked considering productivity
      const totalWorkingTime = calculateProductivity();

      // Calculate clock-out time, taking into account lunch and meetings
      let { hour, minute } = calculateClockOut(totalWorkingTime);

      // Adjust for AM/PM and ensure 12-hour format
      const { hour: adjustedHour, ampm } = adjustForAmPm(hour);
      hour = adjustedHour;

      // Calculate days passed if working across multiple days
      const days = Math.floor(hour / 24);

      // Ensure the clock-out hour is in 12-hour format
      hour = hour % 12 || 12;

      // Update the display with the calculated times
      UpdateDisplay({ hour, minute, ampm, days }, totalWorkingTime);
    };

    // Helper function to sum hours and minutes into only minutes and apply productivity percentage
    function calculateProductivity() {
      // Hours + minutes divided by productivity
      const totalWorkingMinutes = ((time.values.working.hour * 60) + time.values.working.minute) / time.values.productivity;

      return {
        hour: Math.floor(totalWorkingMinutes / 60),
        minute: Math.floor(totalWorkingMinutes % 60),
      };
    }

    // Helper function to calculate clock-out time
    function calculateClockOut({ hour, minute }) {
      hour += time.values.clockIn.hour;
      minute += time.values.clockIn.minute + time.values.lunch + time.values.meeting - time.values.lost;

      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute %= 60;
      }

      return { hour, minute };
    }

    // Helper function to adjust for AM/PM and ensure 12-hour format
    function adjustForAmPm(hour) {
      const isPm = Math.floor(hour / 12) % 2 !== 0;
      const ampm = isPm ? (time.values.ampm === "AM" ? "PM" : "AM") : time.values.ampm;
      return { hour, ampm };
    }


    const UpdateDisplay = (clockOut, totalWorking) => {
      // Selectors for output elements
      const output = $("#Output");
      const totalTime = $("#TotalTime");

      // Helper to format the time output
      const formatTime = ({ hour, minute, ampm, days }) => {
        const formattedTime = `${hour}:${minute < 10 ? '0' : ''}${minute} ${ampm}`;
        return days > 0 ? `${formattedTime} +${days} day(s)` : formattedTime;
      };

      // Helper to format the total working time
      const formatTotalWorkingTime = ({ hour, minute }) => `${hour} hours ${minute} minutes at ${(time.values.productivity * 100)}% productivity`;

      // Update the output based on whether clockOut and totalWorking are defined
      if (clockOut && totalWorking) {
        output.html(formatTime(clockOut));
        totalTime.html(formatTotalWorkingTime(totalWorking));
      } else {
        // Clear output if values are undefined
        output.html(":");
        totalTime.html("");
      }
    };

    $("#DarkModeToggle").click(() => {
      const mainHTML = $("html");
      const button = $(".btn");

      // Determine the new theme based on the current one
      const newTheme = mainHTML.attr("data-bs-theme") === "light" ? "dark" : "light";

      // Update the theme attribute directly
      mainHTML.attr("data-bs-theme", newTheme);
      button.toggleClass("btn-outline-dark btn-outline-light");
    });

    $("#Settings").click(() => {
      $("#SettingsArrow").toggleClass("bi-chevron-down bi-chevron-up");
    });

  })();
})