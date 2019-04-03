import  {load_blocks,lockStatus ,removeLock} from './sync-client';
var queue = new Array();
var queueMap = new Object();

var jobId = 1, jobNotRunning = true, currentDelay = 1, newJob = null;
const defaultMaxRetries = 5, defaultDelay = 1;

export const create = (job,maxRetries=null,delay=null) =>{
  console.log(job.file.name);
  if(!queueMap[job.file.name]) {
    queueMap[job.file.name] = true;
    job.maxRetries = (maxRetries|| defaultMaxRetries);
    job.id = jobId;
    queue.push(job);
    jobId += 1;
    startSyncing( ( delay || defaultDelay), (job.maxRetries - 1) * (delay || defaultDelay) );
  }
}




const startSyncing = (delay , ttl) => {
   
    if(jobNotRunning) {
      jobNotRunning = false;
      currentDelay = delay;

      var syncIntervalPointer = setInterval(()=>{
        if(lockStatus() && queue.length){
            newJob = queue.shift();
            load_blocks(newJob);

            if(ttl) {
              setTimeout(removeLock(newJob), ttl * 1000);
            }

        } else if(!queue.length) {
            jobNotRunning = true;
            clearInterval(syncIntervalPointer);
        }
      }, 1000 * currentDelay);
    } else if(currentDelay != delay){
      currentDelay = delay;
      clearInterval(syncIntervalPointer);
      startSyncing(currentDelay);
    
    }else{
      return ;
    }
}

export const requeue = (job) =>{
  if(job.maxRetries) {
    console.log('added requeue');
    job.maxRetries -= 1;
    if(!queueMap[job.file.name]) {
      queueMap[job.file.name] = true;
      queue.push(job);
      startSyncing(currentDelay ,  (job.maxRetries - 1) * currentDelay);
    }

  } else {
    return ;
  }
}
