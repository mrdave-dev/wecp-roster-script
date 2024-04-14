/**
 * Todo:
 * * Instead of going straight down, iterate row-wise first and put the child, then the adults after, repeat
 * * Add bg color for adult's expected attendance day
 * * Add rows for teacher, counselor
 * * Create section for configurable variables
 * * Write docs
 * 
 */

function listNamesVerticallyAndRetain() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = ss.getSheetByName("Roster"); // This is your source sheet
  var listSheet = ss.getSheetByName("Attendance"); // This is your destination sheet. Make sure it exists or adjust the name accordingly

  // Define the range on the Roster sheet to read from
  var range = rosterSheet.getRange("A2:E30"); // Adjust the range as per your requirements
  var values = range.getValues();
  
  // Flatten the array of values
  var namesList = [].concat.apply([], values);
  
  // Remove empty values
  namesList = namesList.filter(function(name) {
    return name !== "";
  });
  
  // Get existing data from the List sheet to retain information
  var existingData = listSheet.getDataRange().getValues();
  var existingNames = existingData.map(function(row) { return row[0]; }); // Assuming names are in the first column
  
  // Prepare new list keeping existing data if the name already exists
  var newList = [];
  namesList.forEach(function(name) {
    var index = existingNames.indexOf(name);
    var row = index > -1 ? existingData[index] : [name];
    newList.push(row);
  });
  
  // Clear the List sheet before repopulating
  listSheet.clear();
  
  // Write the new list to the List sheet
  newList.forEach(function(row, index) {
    listSheet.getRange(index + 2, 1, 1, row.length).setValues([row]);
  });
  
  SpreadsheetApp.getUi().alert('List sheet has been updated.');
}

function populateClassDatesWithDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var attendanceSheet = ss.getSheetByName('Attendance'); // Ensure correct sheet name
  
  // Class days and date range setup
  var classDays = ['Tuesday', 'Thursday'];
  var startDate = new Date('2024-01-01');
  var endDate = new Date('2024-04-30');
  
  attendanceSheet.getRange('B1:1').clearContent(); // Clear previous dates
  
  var currentDate = new Date(startDate);
  var columnIndex = 2; // Start from column B

  while (currentDate <= endDate) {
    var dayOfWeek = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'EEEE');
    
    if (classDays.includes(dayOfWeek)) {
      var formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'EEEE yyyy-MM-dd');
      attendanceSheet.getRange(1, columnIndex).setValue(formattedDate);
      columnIndex++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  // Calculate the last row with content in column A (names column)
  var lastRow = attendanceSheet.getLastRow();
  var namesRange = attendanceSheet.getRange('A2:A' + lastRow);
  var namesValues = namesRange.getValues();
  var lastContentRow = namesValues.reduce((acc, current, index) => current[0] ? index + 2 : acc, 0);

  // Define the range for the dropdowns, from row 2 to the last row with a name
  var lastColumnLetter = columnToLetter(columnIndex-1); // Convert last column index to letter for range
  var dataValidationRange = attendanceSheet.getRange('B2:' + lastColumnLetter + lastContentRow);

  // Create the dropdown list
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(['Present', 'Absent'], true).build();
  
  // Apply the data validation rule to each cell in the range
  dataValidationRange.setDataValidation(rule);
  
  SpreadsheetApp.getUi().alert('Attendance sheet has been updated with class dates and dropdowns.');
}

// Helper function to convert column index to letter (for A-Z only)
function columnToLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// Not quite working, I think the kids are throwing off the adults assigned days.
function highlightWorkingDays() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = ss.getSheetByName("Roster");
  var attendanceSheet = ss.getSheetByName("Attendance");

  // Get the range of names and assigned days from the Roster sheet
  var rosterData = rosterSheet.getRange("A2:F" + rosterSheet.getLastRow()).getValues();

  // Get the range of dates from the Attendance sheet
  var datesRange = attendanceSheet.getRange(1, 2, 1, attendanceSheet.getLastColumn()).getValues()[0];
  
  // Loop through each person and their assigned day in the Roster data
  rosterData.forEach(function(row, index) {
    var personName = row[0];
    var assignedDay = row[5]; // Assuming column F has the assigned days

    // Find the columns in Attendance that match the assigned day
    datesRange.forEach(function(date, colIndex) {
      const dateString = date.toString()
      var dateObj = new Date(dateString.substring(dateString.toString().indexOf(" ") + 1)); // Get date from date string
      var dayName = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "EEEE");
      
      if (dayName === assignedDay) {
        // Set the background color to green for the corresponding cell
        var cellRow = index + 2; // Offset by 2 because data starts at row 2 and to match the row in Attendance
        var cellCol = colIndex + 2; // Offset by 2 because dates start from column B in Attendance
        attendanceSheet.getRange(cellRow, cellCol).setBackground('#00FF00'); // Green
      }
    });
  });

  SpreadsheetApp.getUi().alert('Attendance sheet has been updated with highlighted working days.');
}


