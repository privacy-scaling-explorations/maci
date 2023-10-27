#!/bin/bash
set -e

rargs=4
function checkargs {
    if [ $# -lt $rargs ]
    then
        help
        echo "Error: missing arguments" >&2
        exit 1
    fi

    # Intermediate state tree depth such that 5^istd > max number of messages
    istd=$(echo "l($n)/l(5)" | bc -l )

    if [ $(echo $istd | cut -d . -f2) -ne "00000000000000000000" ]
    then
        echo "Error: Max number of messages must have a prime factor of 5" 1>&2
        exit 1
    fi

    istd=$(echo $istd | cut -d . -f1)
}

help() {
    echo "Builds the processMessage and tallyVotes with custom parameters."
    echo
    echo "Syntax: buildCustomSnarks [-h|s|m|v|i|b|n]"
    echo
    echo "options: "
    echo "s State tree depth"
    echo "m Message tree depth"
    echo "v Vote options tree depth"
    echo "b Message Batch depth (msgSubTreeDepth)"
    echo "n Max number of messages"
}

while getopts ":h:s:m:v:i:b:n:" option; do
   case $option in
      h)
         help
         exit;;
      s)
         std="$OPTARG";;
      m)
         mtd="$OPTARG";;
      v)
         votd="$OPTARG";;
      b)
         b="$OPTARG";;
      n)
         n="$OPTARG";;
     \?)
         echo "Error: Invalid option" 1>&2
         exit;;
   esac
done

checkargs $std $mtd $votd $b $n

cd "$(dirname "$0")"
cd ..

pcircuitdir="./circom/prod/processMessages_custom.circom"
tcircuitdir="./circom/prod/tallyVotes_custom.circom"
touch $pcircuitdir
touch $tcircuitdir

# Write custom circuit files
echo -e "pragma circom 2.0.0;" > $pcircuitdir
echo -e 'include "../processMessages.circom";\n' >> $pcircuitdir
echo "component main {public [inputHash]} = ProcessMessages($std, $mtd, $b, $votd);" >> $pcircuitdir

echo -e "pragma circom 2.0.0;" > $tcircuitdir
echo -e 'include "../tallyVotes.circom";\n' > $tcircuitdir
echo "component main {public [inputHash]} = TallyVotes($std, $istd, $votd);" >> $tcircuitdir
