/**
 * Idea: move the configurations to the sheet. Allow the user to write 'ready' in a cell and then
 * run the start up script, edit triggers, etc.
 * Idea: stats page: classes attended, classes missed, classes covered,
 */

/**
 * Todo:
 * * Add rows for teacher, counselor
 * * Create section for configurable variables
 * * Write docs
 * * Consider if the students should and adults should default to present on their days
 * * Bug: the ratio row is appended if any data is added below the ratio row... should be more robust
 * * Add eslint
 * * Needs big refactor; a lot of things can be way more efficient
* * Base functions should operate on one thing: cell, row, column, whatever. And then be wrapped in functions to
 *   operate on a range of things
 * * Think more like a database
 * * Figure out how to do namespacing / use multiple files, see https://github.com/PopGoesTheWza/ts-gas-project-starter/blob/master/src/common-components/lib1/tsconfig.json
 */

const Version = {
  LIB_VERSION: '0.0.1'
}

const Getters = {
  getActiveSheet: function() {
    return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
  },
  getRangeValue(sheet: GoogleAppsScript.Spreadsheet.Sheet, range: string) {
    return sheet.getRange(range).getValue()
  },
  getRangeValues(sheet: GoogleAppsScript.Spreadsheet.Sheet, range: string) {
    return sheet.getRange(range).getValues()
  },
}

const Setters = {
  setCell: function(sheet: GoogleAppsScript.Spreadsheet.Sheet, cell: string, value: string) {
    sheet.getRange(cell).setValue(value)
  },

  setWidthAndWrap(sheet: GoogleAppsScript.Spreadsheet.Sheet, columnIndex: number, width: number, wrap: boolean = true) {
    sheet.setColumnWidth(columnIndex, width)
    sheet.getRange(1, columnIndex, sheet.getMaxRows()).setWrap(wrap)
  },
}

enum ConfigTypes {
  Date = 'date',
  OffDate = 'off_date',
  Number = 'number',
  Days = 'days',
}

const Setup = {
  DEFAULT_NAME: 'WECP Roster Script 20XX',
  WELCOME_MESSAGE: 'Welcome to the WECP Roster App! ' + `v${Version.LIB_VERSION}`,
  CONFIG_OPTIONS: [
    ['Start date (YYYY-MM-DD)', ConfigTypes.Date],
    ['End date', ConfigTypes.Date],
    ['Holidays', ConfigTypes.OffDate],
    ['Class days', ConfigTypes.Days],
  ],
  
  setWelcomeMessage: function(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { setCell } = Setters
    // Set the name of the sheet
    sheet.setName(this.DEFAULT_NAME)
    // Set first sheet, first cell to the welcome message
    setCell(sheet, 'A1', this.WELCOME_MESSAGE)
  },

  configStartRow: 3, // Start row for configuration options
  setConfigMessage: function(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { setCell } = Setters
    const configMessage = 'Please configure the following options:'
    setCell(sheet, 'A2', configMessage)

    this.CONFIG_OPTIONS.forEach((option, index) => {
      const [name] = option
      setCell(sheet, `A${index + this.configStartRow}`, name)
    })
  },

  parseConfig: function(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { getRangeValues } = Getters
    const config = {}
    this.CONFIG_OPTIONS.forEach((option, index) => {
      const [name] = option
      const value = getRangeValues(sheet, `B${index + this.configStartRow}`)
      config[name] = value
    })
    return config
  },

  setConfigConfirmMessage: function(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { setCell } = Setters
    const startRow = this.configStartRow + this.CONFIG_OPTIONS.length + 1
    const configMessage = 'Set next cell to "ready" to confirm configuration'
    setCell(sheet, `A${startRow}`, configMessage)
  },

  configConfirmReady: function(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { getRangeValue } = Getters
    const ready = getRangeValue(sheet, 'B' + (this.configStartRow + this.CONFIG_OPTIONS.length + 1))
    return ready === 'ready'
  },
}

enum PersonType {
  Student = 'student',
  Adult = 'adult',
  Instructor = 'instructor',
}

interface Person {
  name: string;
  type: PersonType;
  assignedDay?: string;
  relations: string[];
}

const Roster = {
  rosterStartRow: Setup.configStartRow + Setup.CONFIG_OPTIONS.length + 3,

  setRosterMessage: function(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { setCell } = Setters
    const rosterMessage = 'Please enter the roster data below'
    setCell(sheet, `A${this.rosterStartRow}`, rosterMessage)
    setCell(sheet, `A${this.rosterStartRow+1}`, 'Name')
    setCell(sheet, `B${this.rosterStartRow+1}`, 'Adult/Student/Instructor')
    setCell(sheet, `C${this.rosterStartRow+1}`, 'Assigned day (MTWRF)')
    setCell(sheet, `D${this.rosterStartRow+1}`, 'Relations (comma separated)')
  },

  _parsePersonRow(row: string[]): Person {
    const [name, type, assignedDay, relationsRaw] = row
    const relations = relationsRaw.split(',').map(relation => relation.trim())
    return {
      name,
      type: type as PersonType,
      assignedDay,
      relations,
    }
  },

  parse(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const { getRangeValues } = Getters
    const config = Setup.parseConfig(sheet)
    console.log(`Roster range: ${`A${this.rosterStartRow+2}:B${sheet.getLastRow()}`}`)
    const data = getRangeValues(sheet, `A${this.rosterStartRow+2}:D${sheet.getLastRow()}`)
    console.log(`Data from Roster sheet:\n${JSON.stringify(data)}`)
    return data.map(this._parsePersonRow)
  }
}

/**
 * @STARTHERE -- I've got the adults and students parsed, now set up the roster sheet
 * Something like:
 * **INSTRUCTORS**
 * Nellie
 * **STUDENTS**
 * Campbell
 * Violet
 * **ADULTS**
 * Dave (M)
 * Nora (T)
 * **TOTALS**
 * Students
 * Adults
 * Ratio (Adults / Students)
 * 
 * Also need to add ratio requirements to the config
 */

function firstTimeSetup() {
  const sheet = Getters.getActiveSheet()
  Setters.setWidthAndWrap(sheet, 1, 300)
  Setters.setWidthAndWrap(sheet, 2, 150)
  Setters.setWidthAndWrap(sheet, 3, 150)
  Setters.setWidthAndWrap(sheet, 4, 150)
  Setup.setWelcomeMessage(sheet)
  Setup.setConfigMessage(sheet)
  Setup.setConfigConfirmMessage(sheet)
  Roster.setRosterMessage(sheet)
  const config = Setup.parseConfig(sheet)
}

function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  const sheet = e.source.getActiveSheet()
  if (sheet.getName() === Setup.DEFAULT_NAME) {
    if (Setup.configConfirmReady(sheet)) {
      console.log('Config confirmed')
      const config = Setup.parseConfig(sheet)
      console.log(`Parsed config:\n${JSON.stringify(config, null, '  ')}`)
      const roster = Roster.parse(sheet)
      console.log(`Parsed roster:\n${JSON.stringify(roster, null, '  ')}`)
    }
  }
}

function RosterParse() {
  const sheet = Getters.getActiveSheet()
  const roster = Roster.parse(sheet)
  return roster
}



// /**
//  * Old stuff
//  */


// type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'

// interface Person {
//   type: 'student' | 'adult' | 'instructor'
//   name: string
//   assignedDay: Day
//   prevRow?: string
// }

// // Configurable variables
// // Careful with timezones, it may be PDT or PST depending on the time of the year
// const START_DATE_STRING = '2023-01-01'
// const END_DATE_STRING = '2024-01-01'
// const CLASS_DAYS: Day[] = ['Tuesday', 'Thursday']
// const ADULTS_TO_CHILDREN_RATIO = 1 / 2

// // Don't touch these
// const TIMEZONE_OFFSET = new Date().getTimezoneOffset()
// const START_DATE = new Date(START_DATE_STRING)
// const END_DATE = new Date(END_DATE_STRING)

// console.log({ TIMEZONE_OFFSET, START_DATE, END_DATE })

// import { firstTimeSetup } from './lib/setup'

// function x() {
//   firstTimeSetup()
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function main() {
//   console.log('lol')
//   const spreadsheet = getActiveSpreadsheet()
//   const rosterSheet = spreadsheet.getSheetByName('Roster')
//   if (!rosterSheet) {
//     return console.error('"Roster" sheet not found.')
//   }

//   const attendanceSheet = spreadsheet.getSheetByName('Attendance')
//   if (!attendanceSheet) { return console.error('"Attendance" sheet not found.') }

//   const people = getPeopleFromRoster(rosterSheet)
//   console.log('People: ', people)

//   /**
//    * @TODO Preserve old data before clearing and writing
//    */
//   attendanceSheet.clear()

//   const dates = getClassDays(START_DATE, END_DATE, CLASS_DAYS)
//   console.log(`Class days: ${dates}`)

//   attendanceSheet.setFrozenRows(1)
//   attendanceSheet.setFrozenColumns(1)

//   populateAttendanceHeaderRow(attendanceSheet, dates)
//   populateAttendanceNameColumn(attendanceSheet, people)
//   populateAttendanceCells(attendanceSheet, people, dates)
//   populateRatioCells(attendanceSheet, people, 2, dates.length)
// }

// function getActiveSpreadsheet() {
//   const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
//   console.log(`Running script on sheet ${spreadsheet.getUrl()}`)
//   return spreadsheet
// }

// /**
//  * Calculates a ratio of adults to children for each day
//  * @param sheet
//  * @param people
//  * @param dates
//  */
// function populateRatioCells(
//   sheet: GoogleAppsScript.Spreadsheet.Sheet,
//   people: Record<string, Person>,
//   startColumn: number = 2,
//   columnsToCalculate: number = sheet.getLastColumn() - startColumn,
//   skipSetup: boolean = false,
// ) {
//   // Populate the ratio cell with a sheet function to calculate the ratio of adults to children
//   const ratioRow = sheet.getRange(sheet.getLastRow(), 1).getValue() === 'Ratio'
//     ? sheet.getLastRow()
//     : sheet.getLastRow() + 2

//   if (skipSetup === false) {
//     sheet.getRange(ratioRow, 1).setValue('Ratio')
//   }

//   // For each column, count the number of students Present vs the number of adults Present
//   const names = Object.keys(people)

//   console.log(`Start column: ${startColumn}, columns to calculate: ${columnsToCalculate}`)
//   for (let col = startColumn; col < startColumn + columnsToCalculate; col += 1) {
//     console.log(`Calculating ratio for column ${col}`)

//     let studentCount = 0
//     let adultCount = 0
//     const columnRange = sheet.getRange(2, col, names.length, 1)
//     const columnValues = columnRange.getValues()
//     console.log(`Column values: ${JSON.stringify(columnValues)}`)
//     names.forEach((name) => {
//       const person = people[name]
//       const row = names.indexOf(name) + 2
//       const cell = sheet.getRange(row, col)
//       const value = cell.getValue()
//       if (value === 'Present') {
//         if (person.type === 'student') {
//           console.log(`Student ${name} is present on ${col}`)
//           studentCount += 1
//         }
//         else if (person.type === 'adult') {
//           console.log(`Adult ${name} is present on ${col}`)
//           adultCount += 1
//         }
//       }
//     })

//     // const studentCount = names.filter(name => people[name].type === 'student').reduce((acc, name) => {
//     //   const cell = sheet.getRange(names.indexOf(name) + 2, col)
//     //   if (cell.getValue() === 'Present') {
//     //     console.log(`Student ${name} is present on ${col}`)
//     //     return acc + 1
//     //   }
//     //   return acc
//     // }, 0)
//     // const adultCount = names.filter(name => people[name].type === 'adult').reduce((acc, name) => {
//     //   const cell = sheet.getRange(names.indexOf(name) + 2, col)
//     //   if (cell.getValue() === 'Present') {
//     //     return acc + 1
//     //   }
//     //   return acc
//     // }, 0)

//     const ratio = adultCount / studentCount
//     const ratioDisplayValue = ratio === Infinity || Number.isNaN(ratio) ? 'N/A' : ratio
//     sheet.getRange(ratioRow - 1, col).setValue(`${adultCount} / ${studentCount}`)
//     sheet.getRange(ratioRow, col).setValue(ratioDisplayValue)
//     console.log(`Ratio: ${ratio} ${ratio < ADULTS_TO_CHILDREN_RATIO}`)
//     if (ratio < ADULTS_TO_CHILDREN_RATIO) {
//       sheet.getRange(ratioRow, col).setBackground('#FF0000')
//     }
//     else {
//       // Clear background color
//       sheet.getRange(ratioRow, col).setBackground(null)
//     }
//   }
//   /**
//    * Start here -- should probably add a blank row first
//    * -- Also add a row for adults sum, students sum
//    * -- Add conditional color for cell based on ratio
//    */
// }

// function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
//   const sheet = e.source.getActiveSheet()
//   const editedColumn = e.range.getColumn()

//   // If edit is attendance sheet, call the ratio function
//   if (sheet.getName() === 'Attendance') {
//     console.log('onEdit: Attendance sheet')
//     const rosterSheet = e.source.getSheetByName('Roster')
//     if (!rosterSheet) throw new Error('Expected to find Roster sheet')
//     const people = getPeopleFromRoster(rosterSheet)
//     const dates = getClassDays(START_DATE, END_DATE, CLASS_DAYS)
//     populateRatioCells(sheet, people, editedColumn, 1, true)
//   }
// }

// /**
//  * Populates adult cells with a cells with a drop down that includes 'Present', 'Absent' or any
//  * other adults name. For students, the cell is only 'Present' or 'Absent'.
//  *
//  * Also colors the cell green if the adult is expected to be there on that day.
//  *
//  * @TODO This seems to be slow. Set trace statements to measure timing and consider optimization
//  *
//  * @param sheet
//  * @param people
//  * @param dates
//  */
// function populateAttendanceCells(
//   sheet: GoogleAppsScript.Spreadsheet.Sheet,
//   people: Record<string, Person>,
//   dates: Date[],
// ) {
//   const adultNames = Object.keys(people).filter(name => people[name].type === 'adult')
//   const names = Object.keys(people)
//   names.forEach((name) => {
//     const person = people[name]
//     const row = names.indexOf(name) + 2
//     dates.forEach((date, col) => {
//       const cell = sheet.getRange(row, col + 2)
//       if (person.type === 'adult') {
//         const validAdults = adultNames.filter(adultName => adultName !== name)
//         const rule = SpreadsheetApp.newDataValidation().requireValueInList(['Present', 'Absent', ...validAdults], true).build()
//         cell.setDataValidation(rule)
//         if (person.assignedDay === date.toLocaleDateString('en-US', { weekday: 'long' })) {
//           cell.setBackground('#00FF00')
//         }
//       }
//       else {
//         const rule = SpreadsheetApp.newDataValidation().requireValueInList(['Present', 'Absent'], true).build()
//         cell.setDataValidation(rule)
//       }
//     })
//   })
// }

// function populateAttendanceNameColumn(sheet: GoogleAppsScript.Spreadsheet.Sheet, people: Record<string, Person>) {
//   const names = Object.keys(people)
//   console.log(`Names: ${names}`)

//   const nameColumn = sheet.getRange(2, 1, names.length, 1)
//   nameColumn.setValues(names.map(name => [name]))
//   // Bold adults names
//   const boldRanges = names.filter(name => people[name].type === 'adult').map((name) => {
//     const row = names.indexOf(name) + 2
//     return sheet.getRange(row, 1)
//   })
//   boldRanges.forEach(range => range.setFontWeight('bold'))
// }

// function populateAttendanceHeaderRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, dates: Date[]) {
//   const headerRow = sheet.getRange(1, 1, 1, dates.length + 1)
//   headerRow.setNumberFormat('@')
//   const headerValues = dates.map(date => `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${date.toLocaleDateString()}`)
//   headerValues.unshift('Name')
//   headerRow.setValues([headerValues])
//   /**
//    * @TODO Move this to a function and execute at the end
//    */
//   for (let i = 2; i <= dates.length + 1; i++) {
//     sheet.autoResizeColumn(i)
//   }
// }

// /**
//  * Finds the days of the week that are class days between the start (inclusive) and end date
//  * (exclusive)
//  * @param startDate
//  * @param endDate
//  * @param classDays
//  */
// function getClassDays(startDate: Date, endDate: Date, classDays: Day[]): Date[] {
//   const dates: Date[] = []
//   for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
//     if (classDays.includes(date.toLocaleDateString('en-US', { weekday: 'long' }) as Day)) {
//       dates.push(new Date(date))
//     }
//   }
//   return dates
// }

// /**
//  * Parses information from the Roster sheet.
//  * @param rosterSheet
//  * @returns Returns map with name as key and Person object as value
//  */
// function getPeopleFromRoster(rosterSheet: GoogleAppsScript.Spreadsheet.Sheet): Record<string, Person> {
//   console.log('Last row:', rosterSheet.getLastRow())
//   const data = rosterSheet.getRange('A2:F' + rosterSheet.getLastRow()).getValues()
//   console.log(`Data from Roster sheet:\n${JSON.stringify(data)}`)

//   return data.reduce<Record<string, Person>>((acc, row) => {
//     const student: Person = {
//       type: 'student',
//       name: row[0],
//       assignedDay: row[row.length - 1],
//     }
//     acc[student.name] = student
//     const adults = row.slice(1, row.length - 1).filter(Boolean).map<Person>(name => ({
//       type: 'adult',
//       name,
//       assignedDay: row[row.length - 1],
//     })).forEach((adult) => {
//       acc[adult.name] = adult
//     })
//     return acc
//   }, {} as Record<string, Person>)
// }

// // function listNamesVerticallyAndRetain() {
// //   // Define the range on the Roster sheet to read from
// //   var range = rosterSheet.getRange("A2:E30"); // Adjust the range as per your requirements
// //   var values = range.getValues();

// //   // Flatten the array of values
// //   var namesList = [].concat.apply([], values);

// //   // Remove empty values
// //   namesList = namesList.filter(function(name) {
// //     return name !== "";
// //   });

// //   // Get existing data from the List sheet to retain information
// //   var existingData = listSheet.getDataRange().getValues();
// //   var existingNames = existingData.map(function(row) { return row[0]; }); // Assuming names are in the first column

// //   // Prepare new list keeping existing data if the name already exists
// //   var newList = [];
// //   namesList.forEach(function(name) {
// //     var index = existingNames.indexOf(name);
// //     var row = index > -1 ? existingData[index] : [name];
// //     newList.push(row);
// //   });

// //   // Clear the List sheet before repopulating
// //   listSheet.clear();

// //   // Write the new list to the List sheet
// //   newList.forEach(function(row, index) {
// //     listSheet.getRange(index + 2, 1, 1, row.length).setValues([row]);
// //   });

// //   SpreadsheetApp.getUi().alert('List sheet has been updated.');
// // }

// // function populateClassDatesWithDropdowns() {
// //   var ss = SpreadsheetApp.getActiveSpreadsheet();
// //   var attendanceSheet = ss.getSheetByName('Attendance'); // Ensure correct sheet name

// //   // Class days and date range setup
// //   var classDays = ['Tuesday', 'Thursday'];
// //   var startDate = new Date('2024-01-01');
// //   var endDate = new Date('2024-04-30');

// //   attendanceSheet.getRange('B1:1').clearContent(); // Clear previous dates

// //   var currentDate = new Date(startDate);
// //   var columnIndex = 2; // Start from column B

// //   while (currentDate <= endDate) {
// //     var dayOfWeek = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'EEEE');

// //     if (classDays.includes(dayOfWeek)) {
// //       var formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'EEEE yyyy-MM-dd');
// //       attendanceSheet.getRange(1, columnIndex).setValue(formattedDate);
// //       columnIndex++;
// //     }

// //     currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
// //   }

// //   // Calculate the last row with content in column A (names column)
// //   var lastRow = attendanceSheet.getLastRow();
// //   var namesRange = attendanceSheet.getRange('A2:A' + lastRow);
// //   var namesValues = namesRange.getValues();
// //   var lastContentRow = namesValues.reduce((acc, current, index) => current[0] ? index + 2 : acc, 0);

// //   // Define the range for the dropdowns, from row 2 to the last row with a name
// //   var lastColumnLetter = columnToLetter(columnIndex-1); // Convert last column index to letter for range
// //   var dataValidationRange = attendanceSheet.getRange('B2:' + lastColumnLetter + lastContentRow);

// //   // Create the dropdown list
// //   var rule = SpreadsheetApp.newDataValidation().requireValueInList(['Present', 'Absent'], true).build();

// //   // Apply the data validation rule to each cell in the range
// //   dataValidationRange.setDataValidation(rule);

// //   SpreadsheetApp.getUi().alert('Attendance sheet has been updated with class dates and dropdowns.');
// // }

// // // Helper function to convert column index to letter (for A-Z only)
// // function columnToLetter(column) {
// //   var temp, letter = '';
// //   while (column > 0) {
// //     temp = (column - 1) % 26;
// //     letter = String.fromCharCode(temp + 65) + letter;
// //     column = (column - temp - 1) / 26;
// //   }
// //   return letter;
// // }

// // // Not quite working, I think the kids are throwing off the adults assigned days.
// // function highlightWorkingDays() {
// //   var ss = SpreadsheetApp.getActiveSpreadsheet();
// //   var rosterSheet = ss.getSheetByName("Roster");
// //   var attendanceSheet = ss.getSheetByName("Attendance");

// //   // Get the range of names and assigned days from the Roster sheet
// //   var rosterData = rosterSheet.getRange("A2:F" + rosterSheet.getLastRow()).getValues();

// //   // Get the range of dates from the Attendance sheet
// //   var datesRange = attendanceSheet.getRange(1, 2, 1, attendanceSheet.getLastColumn()).getValues()[0];

// //   // Loop through each person and their assigned day in the Roster data
// //   rosterData.forEach(function(row, index) {
// //     var personName = row[0];
// //     var assignedDay = row[5]; // Assuming column F has the assigned days

// //     // Find the columns in Attendance that match the assigned day
// //     datesRange.forEach(function(date, colIndex) {
// //       const dateString = date.toString()
// //       var dateObj = new Date(dateString.substring(dateString.toString().indexOf(" ") + 1)); // Get date from date string
// //       var dayName = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "EEEE");

// //       if (dayName === assignedDay) {
// //         // Set the background color to green for the corresponding cell
// //         var cellRow = index + 2; // Offset by 2 because data starts at row 2 and to match the row in Attendance
// //         var cellCol = colIndex + 2; // Offset by 2 because dates start from column B in Attendance
// //         attendanceSheet.getRange(cellRow, cellCol).setBackground('#00FF00'); // Green
// //       }
// //     });
// //   });

// //   SpreadsheetApp.getUi().alert('Attendance sheet has been updated with highlighted working days.');
// // }
