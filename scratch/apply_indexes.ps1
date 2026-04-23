$ErrorActionPreference = 'Continue'
Write-Host 'Applying index: unique_tradeName ...'
appwrite databases create-index --database-id itimocktest --collection-id 667e7755002efc107f60 --key unique_tradeName --type unique --attributes tradeName --orders asc
Write-Host 'Applying index: unique_tradeCode ...'
appwrite databases create-index --database-id itimocktest --collection-id 667e7755002efc107f60 --key unique_tradeCode --type unique --attributes tradeCode --orders asc
Write-Host 'Applying index: userId_unique ...'
appwrite databases create-index --database-id itimocktest --collection-id 66937340001047368f32 --key userId_unique --type unique --attributes userId --orders asc
Write-Host 'Applying index: email_unique ...'
appwrite databases create-index --database-id itimocktest --collection-id 66937340001047368f32 --key email_unique --type unique --attributes email --orders asc
Write-Host 'Applying index: enrollmentStatus_key ...'
appwrite databases create-index --database-id itimocktest --collection-id 66937340001047368f32 --key enrollmentStatus_key --type key --attributes enrollmentStatus
Write-Host 'Applying index: userName_fulltext ...'
appwrite databases create-index --database-id itimocktest --collection-id 66937340001047368f32 --key userName_fulltext --type fulltext --attributes userName --orders asc
Write-Host 'Applying index: teacherId_key ...'
appwrite databases create-index --database-id itimocktest --collection-id 66936df000108d8e2364 --key teacherId_key --type key --attributes teacherId start_date --orders ASC ASC
Write-Host 'Applying index: isActive_key ...'
appwrite databases create-index --database-id itimocktest --collection-id 66936df000108d8e2364 --key isActive_key --type key --attributes isActive end_date --orders ASC ASC
Write-Host 'Applying index: BatchName_fulltext ...'
appwrite databases create-index --database-id itimocktest --collection-id 66936df000108d8e2364 --key BatchName_fulltext --type fulltext --attributes BatchName --orders asc
Write-Host 'Applying index: idx_student_batch ...'
appwrite databases create-index --database-id itimocktest --collection-id batchRequests --key idx_student_batch --type unique --attributes studentId batchId --orders ASC ASC
Write-Host 'Applying index: idx_batch_status ...'
appwrite databases create-index --database-id itimocktest --collection-id batchRequests --key idx_batch_status --type key --attributes batchId status --orders ASC ASC
Write-Host 'Applying index: idx_batch ...'
appwrite databases create-index --database-id itimocktest --collection-id batchStudents --key idx_batch --type key --attributes batchId --orders ASC
Write-Host 'Applying index: idx_student ...'
appwrite databases create-index --database-id itimocktest --collection-id batchStudents --key idx_student --type key --attributes studentId --orders ASC
Write-Host 'Applying index: idx_unique_membership ...'
appwrite databases create-index --database-id itimocktest --collection-id batchStudents --key idx_unique_membership --type unique --attributes batchId studentId --orders ASC ASC
Write-Host 'Applying index: tags_search ...'
appwrite databases create-index --database-id itimocktest --collection-id 667932c5000ff8e2d769 --key tags_search --type fulltext --attributes tags
Write-Host 'Applying index: moduleId_index ...'
appwrite databases create-index --database-id itimocktest --collection-id 667932c5000ff8e2d769 --key moduleId_index --type key --attributes moduleId
Write-Host 'Applying index: idx_user_batch ...'
appwrite databases create-index --database-id itimocktest --collection-id newAttendance --key idx_user_batch --type key --attributes userId batchId --orders ASC ASC
Write-Host 'Applying index: idx_batch_date ...'
appwrite databases create-index --database-id itimocktest --collection-id newAttendance --key idx_batch_date --type key --attributes batchId date --orders ASC ASC
Write-Host 'Applying index: idx_user_batch_date ...'
appwrite databases create-index --database-id itimocktest --collection-id newAttendance --key idx_user_batch_date --type unique --attributes userId batchId date --orders ASC ASC ASC
Write-Host 'Applying index: idx_batch_date ...'
appwrite databases create-index --database-id itimocktest --collection-id dailyDiary --key idx_batch_date --type key --attributes batchId date --orders ASC DESC
Write-Host 'Applying index: idx_batch_date ...'
appwrite databases create-index --database-id itimocktest --collection-id holidayDays --key idx_batch_date --type key --attributes batchId date --orders ASC ASC
Write-Host 'Applying index: idx_trade_subject_year ...'
appwrite databases create-index --database-id itimocktest --collection-id newmodulesdata --key idx_trade_subject_year --type key --attributes tradeId subjectId year --orders ASC ASC ASC
Write-Host 'Applying index: index_2 ...'
appwrite databases create-index --database-id itimocktest --collection-id newmodulesdata --key index_2 --type unique --attributes tradeId subjectId moduleId --orders asc asc asc
Write-Host 'Applying index: idx_batch_user ...'
appwrite databases create-index --database-id itimocktest --collection-id userBatchStats --key idx_batch_user --type key --attributes batchId userId --orders ASC ASC
