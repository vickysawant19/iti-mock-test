/* eslint-disable react/prop-types */
import BasicInfoCard from "./BasicInfoCard";
import ScheduleSettingsCard from "./ScheduleSettingsCard";
import AttendanceLocationCard from "./AttendanceLocationCard";
import ScheduleSessionsCard from "./ScheduleSessionsCard";

const BatchFormFields = ({
  register,
  collegesData,
  tradesData,
  canMarkAttendance,
  isBatchDataLoading,
  watch,
  setValue,
  batchData,
  showMaps,
  setShowMaps,
  locationLoading,
  handleGetLocation,
  sessions,
  setSessions,
}) => (
  <>
    <div className="space-y-5">
      <BasicInfoCard
        register={register}
        collegesData={collegesData}
        tradesData={tradesData}
        isBatchDataLoading={isBatchDataLoading}
      />
      <ScheduleSettingsCard
        register={register}
        canMarkAttendance={canMarkAttendance}
        isBatchDataLoading={isBatchDataLoading}
      />
      <AttendanceLocationCard
        register={register}
        watch={watch}
        setValue={setValue}
        batchData={batchData}
        showMaps={showMaps}
        setShowMaps={setShowMaps}
        locationLoading={locationLoading}
        handleGetLocation={handleGetLocation}
      />
    </div>
    <ScheduleSessionsCard sessions={sessions} setSessions={setSessions} />
  </>
);

export default BatchFormFields;
