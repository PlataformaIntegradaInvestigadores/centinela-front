export interface RESTConsensusResult {
  message: string;
  results: Result[];
}

export interface Result {
  id_topic: number;
  topic_name: string;
  final_value: number;
  labels: string[];
}
