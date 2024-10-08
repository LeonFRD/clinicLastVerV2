# Clinic Scheduler

Clinic Scheduler is a comprehensive web application designed to manage and display schedules for a medical clinic. It provides an intuitive interface for administrators to manage doctors and their schedules, while also offering convenient views for patients and room-specific information.

## Features

- **Multi-language Support**: Fully supports English and Hebrew, with right-to-left (RTL) layout for Hebrew.
- **Admin Dashboard**: Manage doctors and their schedules efficiently.
- **Patient View**: Display daily schedules for all doctors.
- **Room View**: Show schedules for specific rooms.
- **Real-time Updates**: Uses WebSocket for instant schedule updates across all views.
- **Responsive Design**: Works on various screen sizes, from mobile to desktop.

## Main Components

1. **ClinicScheduler**: The main dashboard for administrators to manage and view all schedules.
2. **PatientView**: A public-facing view showing all doctors' schedules for the current day.
3. **RoomView**: Displays the schedule for a specific room.
4. **RoomPreviewModal**: A quick preview of a room's schedule accessible from the main dashboard.
5. **AddScheduleModal**: Interface for adding new schedules.
6. **ManageDoctorsModal**: Interface for adding, editing, and removing doctors.

## Technologies Used

- React.js
- Ant Design (UI Library)
- i18next (Internationalization)
- Socket.io (Real-time updates)
- Express.js (Backend server)

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/LeonFRD/clinicLastVer.git
   cd clinicLastVer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

- **Admin View**: Access the main dashboard to manage schedules and doctors.
- **Patient View**: Navigate to the "/patient" route to see today's schedules for all doctors.
- **Room View**: Click on a room in the admin dashboard or go to "/room/:roomNumber" to see a specific room's schedule.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Ant Design for the UI components
- i18next for the internationalization support
- The React community for continuous inspiration and support